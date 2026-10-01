import type { Request, Response } from 'express';

import express, { Router } from 'express';
import { Op } from 'sequelize';

import { env } from 'server/env';
import { Collection, CrossrefDepositRecord, Pub } from 'server/models';
import { wrap } from 'server/wrap';
import { type DepositStatus, isDepositStatus } from 'utils/crossref/depositStatus';

import {
	asDate,
	asString,
	DELIVERY_HEADER,
	type DoilyWebhookPayload,
	EVENT_HEADER,
	isTestPayload,
	SIGNATURE_HEADER,
	shouldApplyDepositState,
	verifyDoilySignature,
} from './webhookContract';

/**
 * Inbound half of the Doily webhook contract (see ./webhookContract.ts for the
 * headers, the signature and the ordering rule). Doily POSTs one of
 * deposit.registered / deposit.failed / deposit.submitted whenever a deposit
 * changes state at the registrar, which is how PubPub finally learns that a DOI
 * Crossref accepted on the wire was rejected hours later.
 *
 * Two properties of the sender shape everything here:
 *
 * 1. The HMAC covers the exact bytes Doily serialized. Re-serializing a parsed
 *    body cannot reproduce them (key order and whitespace differ), so this route
 *    takes its body as a Buffer and is mounted ahead of the global
 *    express.json() in server/server.ts.
 * 2. Delivery is at least once, and can arrive out of order. So a payload is
 *    treated as a state assertion, never a command: applying it twice writes the
 *    same columns twice, and an assertion older than what we already know is
 *    dropped.
 */

export const DOILY_WEBHOOK_PATH = '/api/doily/webhook';

const log = (message: string) => console.log(`[doily-webhook] ${message}`);
const warn = (message: string) => console.warn(`[doily-webhook] ${message}`);

/**
 * Find the deposit record this payload is about. By Doily's deposit id first,
 * since that is exact. The DOI fallbacks matter for every deposit made before
 * this feature existed: those rows have no doilyDepositId and no doi of their
 * own, and the only thing tying them to a DOI is the Pub or Collection that
 * points at them. Matching is exact rather than case-insensitive on purpose: the
 * DOI in the payload is the one PubPub itself sent to Doily.
 */
const findDepositRecord = async (options: { depositId: string | null; doi: string | null }) => {
	const { depositId, doi } = options;
	if (depositId) {
		const byDepositId = await CrossrefDepositRecord.findOne({
			where: { doilyDepositId: depositId },
		});
		if (byDepositId) {
			return byDepositId;
		}
	}
	if (!doi) {
		return null;
	}
	const byDoi = await CrossrefDepositRecord.findOne({
		where: { doi },
		order: [['updatedAt', 'DESC']],
	});
	if (byDoi) {
		return byDoi;
	}
	const [pub, collection] = await Promise.all([
		Pub.findOne({
			where: { doi, crossrefDepositRecordId: { [Op.not]: null } },
			attributes: ['id', 'crossrefDepositRecordId'],
		}),
		Collection.findOne({
			where: { doi, crossrefDepositRecordId: { [Op.not]: null } },
			attributes: ['id', 'crossrefDepositRecordId'],
		}),
	]);
	const recordId = pub?.crossrefDepositRecordId ?? collection?.crossrefDepositRecordId;
	return recordId ? CrossrefDepositRecord.findOne({ where: { id: recordId } }) : null;
};

const handleDoilyWebhook = async (req: Request, res: Response) => {
	const secret = env.DOILY_WEBHOOK_SECRET;
	if (!secret) {
		// 500 rather than a quiet 200: the secret comes from config, so Doily's
		// retries over the next day are exactly the window an operator has to fix
		// it without the event being lost.
		warn('DOILY_WEBHOOK_SECRET is not configured, refusing the delivery');
		return res.status(500).json({ error: 'Webhook secret is not configured' });
	}

	const rawBody = req.body;
	if (!Buffer.isBuffer(rawBody)) {
		// Something parsed the body before this handler ran, so the bytes Doily
		// signed are gone and every signature would fail. Say so instead of
		// answering 401 to legitimate deliveries forever.
		warn('body reached the handler already parsed, raw bytes are required to verify the HMAC');
		return res.status(500).json({ error: 'Webhook body was parsed before verification' });
	}

	if (!verifyDoilySignature({ rawBody, header: req.header(SIGNATURE_HEADER), secret })) {
		warn(`rejected a delivery with an invalid signature (${req.header(DELIVERY_HEADER)})`);
		return res.status(401).json({ error: 'Invalid signature' });
	}

	let payload: DoilyWebhookPayload;
	try {
		payload = JSON.parse(rawBody.toString('utf8'));
	} catch {
		// Cannot happen for a body Doily serialized and signed, so if it does an
		// operator wants it visible in Doily's delivery log rather than swallowed
		// as a success.
		warn('signature verified but the body is not JSON');
		return res.status(400).json({ error: 'Malformed JSON body' });
	}

	const deposit = payload.deposit ?? {};
	const depositId = asString(deposit.id);
	const doi = asString(deposit.doi);
	const deliveryId = asString(payload.deliveryId) ?? req.header(DELIVERY_HEADER) ?? 'unknown';
	const event = asString(payload.event) ?? req.header(EVENT_HEADER) ?? 'unknown';

	if (isTestPayload(payload)) {
		// The console's test button. 2xx so it goes green, and not a single write:
		// its deposit is fabricated, and acting on it would let a button in
		// Doily's UI declare a queued DOI registered.
		log(`ignored test delivery ${deliveryId} (${event})`);
		return res.status(200).json({ ok: true, ignored: 'test' });
	}

	if (!isDepositStatus(deposit.status)) {
		// A status this build does not know about. Keeping the state we have and
		// logging beats writing a word the display rule cannot reason about.
		warn(`ignored delivery ${deliveryId} (${event}) with unknown status ${deposit.status}`);
		return res.status(200).json({ ok: true, ignored: 'unknown-status' });
	}
	const status: DepositStatus = deposit.status;

	const record = await findDepositRecord({ depositId, doi });
	if (!record) {
		// 2xx on purpose. No deposit record is going to appear because Doily asked
		// eight more times over the next day, and an unmatched delivery is the
		// normal shape of a deposit made straight through Doily, or of one whose
		// pub has since been deleted.
		warn(
			`no deposit record for ${event} delivery ${deliveryId} (deposit=${depositId} doi=${doi})`,
		);
		return res.status(200).json({ ok: true, matched: false });
	}

	const incomingAt = asDate(payload.timestamp);
	if (
		!shouldApplyDepositState({
			storedStatus: record.status,
			storedAt: record.lastCheckedAt,
			incomingStatus: status,
			incomingAt,
		})
	) {
		log(
			`dropped stale ${event} delivery ${deliveryId}: ${status} at ${incomingAt?.toISOString()} is older than ${record.status} at ${record.lastCheckedAt?.toISOString()}`,
		);
		return res.status(200).json({ ok: true, applied: false });
	}

	await record.update({
		status,
		// Stamped on every applied delivery, so a row matched by DOI has the exact
		// handle next time.
		doilyDepositId: depositId ?? record.doilyDepositId,
		doi: doi ?? record.doi,
		// Written unconditionally, including as null: a deposit that has just
		// registered must not keep displaying the error text of the attempt before
		// it.
		error: asString(deposit.error),
		// The moment the state was true, not the moment we heard about it, so a
		// retry that arrives an hour late cannot look like fresher news than the
		// verdict that overtook it.
		lastCheckedAt: incomingAt ?? new Date(),
		// Never cleared once set. Doily only sets firstRegisteredAt on the first
		// successful registration and re-registrations leave it alone, but a
		// coalesce here is what guarantees that a delivery which happens to omit
		// it cannot demote a live DOI to unpublishable.
		firstRegisteredAt: asDate(deposit.firstRegisteredAt) ?? record.firstRegisteredAt,
	});

	log(`applied ${event} delivery ${deliveryId}: ${record.id} is now ${status}`);
	return res.status(200).json({ ok: true, applied: true });
};

/**
 * Mounted in server/server.ts BEFORE the global express.json(), which is the
 * whole reason this is its own router: express.raw() has to be the first parser
 * to see this request or the signed bytes are lost. The raw parser accepts any
 * content type because the route serves exactly one producer, and refusing to
 * read the body over a charset-annotated or proxy-rewritten Content-Type would
 * turn every delivery into a 500.
 */
export const doilyWebhookRouter = Router().post(
	DOILY_WEBHOOK_PATH,
	express.raw({ type: '*/*', limit: '1mb' }),
	wrap(handleDoilyWebhook),
);
