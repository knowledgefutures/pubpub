import { createHmac, timingSafeEqual } from 'crypto';

import { getDoiDisplay } from 'utils/crossref/depositStatus';

/**
 * The Doily webhook contract, with nothing in it that touches the database or
 * express. Kept separate from webhook.ts so the two rules that are easy to get
 * wrong (HMAC over the raw bytes, and what to do with an out-of-order delivery)
 * can be exercised on their own, without a Postgres connection.
 *
 *   POST /api/doily/webhook
 *   X-Doily-Event:     deposit.registered | deposit.failed | deposit.submitted
 *   X-Doily-Delivery:  <uuid, stable across the 8 retries of one delivery>
 *   X-Doily-Signature: sha256=<lowercase hex HMAC-SHA256 of the RAW body bytes>
 */

export const SIGNATURE_HEADER = 'x-doily-signature';
export const EVENT_HEADER = 'x-doily-event';
export const DELIVERY_HEADER = 'x-doily-delivery';

/**
 * The DOI Doily's console "send test event" button fabricates. Both this and the
 * payload's `test: true` are checked: a button in another app's UI must never be
 * able to tell PubPub that a real DOI is registered, and 10.0000/ is a reserved
 * prefix that cannot belong to a real deposit.
 */
export const DOILY_TEST_DOI = '10.0000/doily.test';

/**
 * `sha256=<lowercase hex HMAC-SHA256>`, keyed with the subscription secret as
 * the UTF-8 string it was issued as (`whsec_…`, not decoded, not trimmed), over
 * the exact bytes of the request body.
 */
export const signDoilyBody = (secret: string, rawBody: Buffer | string): string =>
	`sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`;

export const verifyDoilySignature = (options: {
	rawBody: Buffer | string;
	header: string | undefined;
	secret: string;
}): boolean => {
	const { rawBody, header, secret } = options;
	if (!header) {
		return false;
	}
	const expected = Buffer.from(signDoilyBody(secret, rawBody), 'utf8');
	const received = Buffer.from(header, 'utf8');
	// timingSafeEqual throws when the lengths differ, and they differ for
	// anything that is not a well-formed `sha256=` + 64 hex chars header. The
	// length check keeps that throw out of the request path. It is not a
	// shortcut around the constant-time compare.
	if (expected.length !== received.length) {
		return false;
	}
	return timingSafeEqual(received, expected);
};

/** The DepositSummary fields this consumer reads. Doily sends more; we ignore it. */
export type DoilyWebhookDeposit = {
	id?: unknown;
	doi?: unknown;
	status?: unknown;
	error?: unknown;
	/**
	 * Set once, on the DOI's first successful registration, and never cleared.
	 * This is what separates "the record does not exist" from "the record exists
	 * and an update to it was rejected", which `status` alone cannot express.
	 */
	firstRegisteredAt?: unknown;
};

export type DoilyWebhookPayload = {
	event?: unknown;
	timestamp?: unknown;
	deliveryId?: unknown;
	test?: unknown;
	deposit?: DoilyWebhookDeposit;
};

export const asString = (value: unknown): string | null =>
	typeof value === 'string' && value.length > 0 ? value : null;

export const asDate = (value: unknown): Date | null => {
	const raw = asString(value);
	if (!raw) {
		return null;
	}
	const date = new Date(raw);
	return Number.isNaN(date.getTime()) ? null : date;
};

/** Is this payload the console's test event rather than a real transition? */
export const isTestPayload = (payload: DoilyWebhookPayload): boolean =>
	payload.test === true || asString(payload.deposit?.doi) === DOILY_TEST_DOI;

/**
 * Whether an incoming assertion should overwrite what the row already says.
 *
 * The failure mode this exists for: a `deposit.submitted` whose first attempt hit
 * a 502 is retried on Doily's backoff, so it can land *after* the
 * `deposit.registered` that followed it. Applied in arrival order that would move
 * a registered DOI back to "pending", hiding it from the pub page, the citations
 * and the Scholar meta tags until the next backfill run.
 *
 * The guard is deliberately narrow: only a *pending* assertion older than an
 * already-*settled* state is refused. A settled verdict (registered, unverified,
 * failed) is always applied, whatever the timestamps say, because `lastCheckedAt`
 * may have been written off PubPub's clock while `timestamp` comes from Doily's,
 * and losing a registration to clock skew is the exact bug this whole feature
 * exists to prevent.
 */
export const shouldApplyDepositState = (options: {
	storedStatus: string | null | undefined;
	storedAt: Date | null | undefined;
	incomingStatus: string;
	incomingAt: Date | null;
}): boolean => {
	const { storedStatus, storedAt, incomingStatus, incomingAt } = options;
	if (getDoiDisplay(incomingStatus) !== 'pending') {
		return true;
	}
	const storedDisplay = getDoiDisplay(storedStatus);
	if (storedDisplay === 'legacy' || storedDisplay === 'pending') {
		return true;
	}
	if (!storedAt || !incomingAt) {
		return true;
	}
	return incomingAt.getTime() >= storedAt.getTime();
};
