import { createChallenge, solveChallenge } from 'altcha-lib';

import { getAltchaHmacKey, verifyCaptchaPayload } from '../captcha';

const createValidPayload = async (): Promise<string> => {
	const hmacKey = getAltchaHmacKey();
	const challenge = await createChallenge({ hmacKey, maxNumber: 1000 });
	const { promise } = solveChallenge(
		challenge.challenge,
		challenge.salt,
		challenge.algorithm,
		challenge.maxnumber,
	);
	const solution = await promise;
	if (!solution) throw new Error('failed to solve challenge');
	return btoa(
		JSON.stringify({
			algorithm: challenge.algorithm,
			challenge: challenge.challenge,
			number: solution.number,
			salt: challenge.salt,
			signature: challenge.signature,
		}),
	);
};

beforeAll(() => {
	process.env.BYPASS_CAPTCHA = undefined;
});

afterAll(() => {
	process.env.BYPASS_CAPTCHA = 'true';
});

describe('verifyCaptchaPayload', () => {
	it('returns false for empty or missing payload', async () => {
		expect(await verifyCaptchaPayload('')).toBe(false);
		expect(await verifyCaptchaPayload(null)).toBe(false);
		expect(await verifyCaptchaPayload(undefined)).toBe(false);
	});

	it('returns false for an invalid payload string', async () => {
		expect(await verifyCaptchaPayload('not-a-valid-payload')).toBe(false);
	});

	it('returns true for a correctly solved challenge', async () => {
		const payload = await createValidPayload();
		expect(await verifyCaptchaPayload(payload)).toBe(true);
	});

	it('returns false for a payload with a wrong solution number', async () => {
		const hmacKey = getAltchaHmacKey();
		const challenge = await createChallenge({ hmacKey, maxNumber: 1000 });
		const tampered = btoa(
			JSON.stringify({
				algorithm: challenge.algorithm,
				challenge: challenge.challenge,
				number: 999999,
				salt: challenge.salt,
				signature: challenge.signature,
			}),
		);
		expect(await verifyCaptchaPayload(tampered)).toBe(false);
	});
});

describe('getAltchaHmacKey', () => {
	it('returns the dev key in non-production mode', () => {
		const key = getAltchaHmacKey();
		expect(typeof key).toBe('string');
		expect(key.length).toBeGreaterThan(0);
	});
});
