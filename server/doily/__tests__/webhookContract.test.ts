import { createHmac } from 'crypto';
import { describe, expect, it } from 'vitest';

import {
	DOILY_TEST_DOI,
	isTestPayload,
	shouldApplyDepositState,
	signDoilyBody,
	verifyDoilySignature,
} from '../webhookContract';

const SECRET = 'whsec_9SsQ2n3f0hVJq7LmZ4pXbWc1AeRtYu8I';

/**
 * A body with keys in the order Doily emits them (not alphabetical), irregular
 * whitespace and a non-ASCII character. Re-serializing the parsed form of this
 * produces different bytes, which is the trap these cases exist to pin.
 */
const RAW_BODY =
	'{"event":"deposit.registered",  "timestamp":"2026-08-12T09:15:00.000Z",' +
	'"deliveryId":"d0f1e2d3-4455-6677-8899-aabbccddeeff",' +
	'"deposit":{"id":"dep_abc123","doi":"10.21428/testing.abc","status":"registered"},' +
	'"note":"kürbis"}';

describe('signDoilyBody', () => {
	it('produces sha256= plus lowercase hex over the raw bytes', () => {
		const signature = signDoilyBody(SECRET, RAW_BODY);
		expect(signature).toMatch(/^sha256=[0-9a-f]{64}$/);
		// Independent of our own helper: the digest Doily computes.
		expect(signature).toBe(
			`sha256=${createHmac('sha256', SECRET).update(RAW_BODY, 'utf8').digest('hex')}`,
		);
	});

	it('signs a Buffer and the equivalent string identically', () => {
		expect(signDoilyBody(SECRET, Buffer.from(RAW_BODY, 'utf8'))).toBe(
			signDoilyBody(SECRET, RAW_BODY),
		);
	});

	it('uses the secret as the literal whsec_ string it was issued as', () => {
		expect(signDoilyBody(SECRET, RAW_BODY)).not.toBe(
			signDoilyBody(SECRET.replace('whsec_', ''), RAW_BODY),
		);
	});
});

describe('verifyDoilySignature', () => {
	it('accepts the signature over the exact bytes received', () => {
		expect(
			verifyDoilySignature({
				rawBody: Buffer.from(RAW_BODY, 'utf8'),
				header: signDoilyBody(SECRET, RAW_BODY),
				secret: SECRET,
			}),
		).toBe(true);
	});

	it('rejects a re-serialized body, which is why the route needs raw bytes', () => {
		// JSON.stringify(JSON.parse(body)) drops the extra whitespace, so the HMAC
		// covers bytes nobody ever sent. A handler reading req.body from
		// express.json() would fail every single delivery this way.
		const reserialized = JSON.stringify(JSON.parse(RAW_BODY));
		expect(reserialized).not.toBe(RAW_BODY);
		expect(
			verifyDoilySignature({
				rawBody: reserialized,
				header: signDoilyBody(SECRET, RAW_BODY),
				secret: SECRET,
			}),
		).toBe(false);
	});

	it('rejects a tampered body, another secret, and a missing header', () => {
		const header = signDoilyBody(SECRET, RAW_BODY);
		expect(verifyDoilySignature({ rawBody: `${RAW_BODY} `, header, secret: SECRET })).toBe(
			false,
		);
		expect(verifyDoilySignature({ rawBody: RAW_BODY, header, secret: 'whsec_other' })).toBe(
			false,
		);
		expect(verifyDoilySignature({ rawBody: RAW_BODY, header: undefined, secret: SECRET })).toBe(
			false,
		);
	});

	it('rejects a malformed header without throwing on the length mismatch', () => {
		// timingSafeEqual throws when the buffers differ in length, so a truncated
		// header must be caught before the compare rather than becoming a 500.
		expect(() =>
			verifyDoilySignature({ rawBody: RAW_BODY, header: 'sha256=deadbeef', secret: SECRET }),
		).not.toThrow();
		expect(
			verifyDoilySignature({ rawBody: RAW_BODY, header: 'sha256=deadbeef', secret: SECRET }),
		).toBe(false);
		expect(verifyDoilySignature({ rawBody: RAW_BODY, header: '', secret: SECRET })).toBe(false);
	});
});

describe('isTestPayload', () => {
	it('recognizes the console test event by either marker', () => {
		expect(isTestPayload({ test: true, deposit: { doi: '10.21428/real.doi' } })).toBe(true);
		expect(isTestPayload({ deposit: { doi: DOILY_TEST_DOI } })).toBe(true);
	});

	it('lets a real transition through', () => {
		expect(isTestPayload({ deposit: { doi: '10.21428/real.doi', status: 'registered' } })).toBe(
			false,
		);
	});
});

describe('shouldApplyDepositState', () => {
	const at = (iso: string) => new Date(iso);

	it('drops a stale pending assertion that would un-register a live DOI', () => {
		// The retry of a deposit.submitted landing after the deposit.registered it
		// preceded. Applied in arrival order it hides a registered DOI.
		expect(
			shouldApplyDepositState({
				storedStatus: 'registered',
				storedAt: at('2026-08-12T10:00:00Z'),
				incomingStatus: 'queued',
				incomingAt: at('2026-08-12T09:00:00Z'),
			}),
		).toBe(false);
	});

	it('applies a pending assertion that is genuinely newer (a re-deposit)', () => {
		expect(
			shouldApplyDepositState({
				storedStatus: 'registered',
				storedAt: at('2026-08-12T10:00:00Z'),
				incomingStatus: 'queued',
				incomingAt: at('2026-08-12T11:00:00Z'),
			}),
		).toBe(true);
	});

	it('never refuses a settled verdict, even one that looks older', () => {
		// lastCheckedAt can be stamped off PubPub's clock and `timestamp` comes
		// from Doily's, so a few seconds of skew must not be able to discard the
		// registrar's answer.
		expect(
			shouldApplyDepositState({
				storedStatus: 'queued',
				storedAt: at('2026-08-12T10:00:00Z'),
				incomingStatus: 'registered',
				incomingAt: at('2026-08-12T09:59:00Z'),
			}),
		).toBe(true);
		expect(
			shouldApplyDepositState({
				storedStatus: 'registered',
				storedAt: at('2026-08-12T10:00:00Z'),
				incomingStatus: 'failed',
				incomingAt: at('2026-08-12T09:59:00Z'),
			}),
		).toBe(true);
	});

	it('accepts anything onto a legacy row or over another pending state', () => {
		expect(
			shouldApplyDepositState({
				storedStatus: null,
				storedAt: null,
				incomingStatus: 'queued',
				incomingAt: at('2026-08-12T09:00:00Z'),
			}),
		).toBe(true);
		expect(
			shouldApplyDepositState({
				storedStatus: 'submitted',
				storedAt: at('2026-08-12T10:00:00Z'),
				incomingStatus: 'queued',
				incomingAt: at('2026-08-12T09:00:00Z'),
			}),
		).toBe(true);
	});

	it('is idempotent: the same assertion twice still applies', () => {
		// At-least-once delivery means the same deliveryId can arrive twice, and
		// re-applying identical state has to be a harmless no-op write.
		const options = {
			storedStatus: 'registered',
			storedAt: at('2026-08-12T10:00:00Z'),
			incomingStatus: 'registered',
			incomingAt: at('2026-08-12T10:00:00Z'),
		};
		expect(shouldApplyDepositState(options)).toBe(true);
		expect(shouldApplyDepositState(options)).toBe(true);
	});

	it('applies when either side has no timestamp to compare', () => {
		expect(
			shouldApplyDepositState({
				storedStatus: 'registered',
				storedAt: null,
				incomingStatus: 'queued',
				incomingAt: at('2026-08-12T09:00:00Z'),
			}),
		).toBe(true);
		expect(
			shouldApplyDepositState({
				storedStatus: 'registered',
				storedAt: at('2026-08-12T10:00:00Z'),
				incomingStatus: 'queued',
				incomingAt: null,
			}),
		).toBe(true);
	});
});
