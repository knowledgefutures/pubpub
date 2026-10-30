import * as crypto from 'node:crypto';
import { vi } from 'vitest';

import { envSchema } from 'server/envSchema';

import {
	decryptPayload,
	decryptPayloadWithKeyInfo,
	encryptPayload,
	introspectRefreshToken,
} from '../oidc.server';
import { checkKfSession } from '../sessionCheck';

// oidc.server reads the client secret once, at import.
vi.hoisted(() => {
	process.env.OIDC_CLIENT_SECRET = 'test-client-secret';
});

vi.mock('../oidc.server', async (importOriginal) => ({
	...(await importOriginal<typeof import('../oidc.server')>()),
	introspectRefreshToken: vi.fn(),
}));

vi.mock('server/utils/logout', () => ({ logout: vi.fn() }));

const SESSION_KEY = crypto.randomBytes(32).toString('base64');
const OTHER_KEY = crypto.randomBytes(32).toString('base64');

/** Decrypt with an explicit key, independent of the code under test. */
function decryptWith(token: string, key: Buffer): any {
	const buf = Buffer.from(token, 'base64url');
	const decipher = crypto.createDecipheriv('aes-256-gcm', key, buf.subarray(0, 12));
	decipher.setAuthTag(buf.subarray(12, 28));
	const plain = Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]);
	return JSON.parse(plain.toString('utf8'));
}

const legacyKey = crypto.createHash('sha256').update('test-client-secret').digest();
const sessionKeyBytes = Buffer.from(SESSION_KEY, 'base64');

afterEach(() => {
	vi.unstubAllEnvs();
});

describe('session payload encryption', () => {
	it('round-trips with KF_SESSION_ENCRYPTION_KEY, encrypting under that key', () => {
		vi.stubEnv('KF_SESSION_ENCRYPTION_KEY', SESSION_KEY);
		const token = encryptPayload({ t: 'refresh-token' });
		expect(decryptPayload(token)).toEqual({ t: 'refresh-token' });
		expect(decryptPayloadWithKeyInfo(token)).toEqual({
			data: { t: 'refresh-token' },
			needsReencrypt: false,
		});
		expect(decryptWith(token, sessionKeyBytes)).toEqual({ t: 'refresh-token' });
		expect(() => decryptWith(token, legacyKey)).toThrow();
	});

	it('still decrypts a value encrypted under the key derived from the client secret', () => {
		vi.stubEnv('KF_SESSION_ENCRYPTION_KEY', '');
		const legacyToken = encryptPayload({ v: 'verifier', h: 'host', r: '/' });
		vi.stubEnv('KF_SESSION_ENCRYPTION_KEY', SESSION_KEY);
		expect(decryptPayload(legacyToken)).toEqual({ v: 'verifier', h: 'host', r: '/' });
		expect(decryptPayloadWithKeyInfo(legacyToken)?.needsReencrypt).toBe(true);
	});

	it('behaves as before when KF_SESSION_ENCRYPTION_KEY is unset', () => {
		vi.stubEnv('KF_SESSION_ENCRYPTION_KEY', '');
		const token = encryptPayload({ u: 'user' });
		expect(decryptWith(token, legacyKey)).toEqual({ u: 'user' });
		expect(decryptPayloadWithKeyInfo(token)).toEqual({
			data: { u: 'user' },
			needsReencrypt: false,
		});
	});

	it('returns null for a value encrypted under a different key', () => {
		vi.stubEnv('KF_SESSION_ENCRYPTION_KEY', OTHER_KEY);
		const token = encryptPayload({ t: 'refresh-token' });
		vi.stubEnv('KF_SESSION_ENCRYPTION_KEY', SESSION_KEY);
		expect(decryptPayload(token)).toBeNull();
		expect(decryptPayloadWithKeyInfo(token)).toBeNull();
	});

	it('returns null for a tampered or malformed value', () => {
		vi.stubEnv('KF_SESSION_ENCRYPTION_KEY', SESSION_KEY);
		const buf = Buffer.from(encryptPayload({ t: 'refresh-token' }), 'base64url');
		buf[buf.length - 1] = (buf[buf.length - 1] + 1) % 256;
		expect(decryptPayload(buf.toString('base64url'))).toBeNull();
		expect(decryptPayload('not-a-token')).toBeNull();
		expect(decryptPayload('')).toBeNull();
	});

	it('refuses a key that is not 32 bytes', () => {
		vi.stubEnv('KF_SESSION_ENCRYPTION_KEY', Buffer.alloc(16).toString('base64'));
		expect(() => encryptPayload({})).toThrow(/32 bytes/);
		expect(() => decryptPayload('anything')).toThrow(/32 bytes/);

		// ...and the env schema refuses it at startup.
		const schema = envSchema.shape.KF_SESSION_ENCRYPTION_KEY;
		expect(schema.safeParse(Buffer.alloc(16).toString('base64')).success).toBe(false);
		expect(schema.safeParse(SESSION_KEY).success).toBe(true);
		expect(schema.safeParse(undefined).success).toBe(true);
	});
});

describe('stored refresh token', () => {
	function fakeSession(kfRefreshToken: string) {
		const session: any = {
			kfRefreshToken,
			kfNextCheck: 0,
			save: vi.fn((cb: (err?: unknown) => void) => cb()),
		};
		const req: any = { session, sessionID: crypto.randomUUID() };
		return { req, session };
	}

	beforeEach(() => {
		vi.mocked(introspectRefreshToken).mockResolvedValue({ active: true, sid: 'kf-session' });
	});

	it('is re-encrypted under KF_SESSION_ENCRYPTION_KEY on its next check', async () => {
		vi.stubEnv('KF_SESSION_ENCRYPTION_KEY', '');
		const legacyToken = encryptPayload({ t: 'refresh-token' });
		vi.stubEnv('KF_SESSION_ENCRYPTION_KEY', SESSION_KEY);
		const { req, session } = fakeSession(legacyToken);

		expect(await checkKfSession(req, {} as any)).toBe(true);

		expect(introspectRefreshToken).toHaveBeenCalledWith('refresh-token');
		expect(session.kfRefreshToken).not.toBe(legacyToken);
		expect(decryptWith(session.kfRefreshToken, sessionKeyBytes)).toEqual({
			t: 'refresh-token',
		});
		expect(session.save).toHaveBeenCalled();
	});

	it('is re-encrypted even when the check fails transiently', async () => {
		vi.mocked(introspectRefreshToken).mockRejectedValue(new Error('timeout'));
		vi.stubEnv('KF_SESSION_ENCRYPTION_KEY', '');
		const legacyToken = encryptPayload({ t: 'refresh-token' });
		vi.stubEnv('KF_SESSION_ENCRYPTION_KEY', SESSION_KEY);
		const { req, session } = fakeSession(legacyToken);

		expect(await checkKfSession(req, {} as any)).toBe(true);
		expect(decryptWith(session.kfRefreshToken, sessionKeyBytes)).toEqual({
			t: 'refresh-token',
		});
		expect(session.save).toHaveBeenCalled();
	});

	it('is left alone when already under KF_SESSION_ENCRYPTION_KEY', async () => {
		vi.stubEnv('KF_SESSION_ENCRYPTION_KEY', SESSION_KEY);
		const token = encryptPayload({ t: 'refresh-token' });
		const { req, session } = fakeSession(token);

		expect(await checkKfSession(req, {} as any)).toBe(true);
		expect(session.kfRefreshToken).toBe(token);
	});

	it('is left under the derived key when KF_SESSION_ENCRYPTION_KEY is unset', async () => {
		vi.stubEnv('KF_SESSION_ENCRYPTION_KEY', '');
		const token = encryptPayload({ t: 'refresh-token' });
		const { req, session } = fakeSession(token);

		expect(await checkKfSession(req, {} as any)).toBe(true);
		expect(session.kfRefreshToken).toBe(token);
	});

	it('tears the session down when it cannot be decrypted', async () => {
		const { logout } = await import('server/utils/logout');
		vi.stubEnv('KF_SESSION_ENCRYPTION_KEY', OTHER_KEY);
		const token = encryptPayload({ t: 'refresh-token' });
		vi.stubEnv('KF_SESSION_ENCRYPTION_KEY', SESSION_KEY);
		const { req } = fakeSession(token);

		expect(await checkKfSession(req, {} as any)).toBe(false);
		expect(logout).toHaveBeenCalled();
		expect(introspectRefreshToken).not.toHaveBeenCalled();
	});
});
