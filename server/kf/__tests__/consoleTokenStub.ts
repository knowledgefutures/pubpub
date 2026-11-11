import { createHash, randomUUID } from 'node:crypto';
import { exportJWK, generateKeyPair, type JWTPayload, SignJWT } from 'jose';
import { vi } from 'vitest';

import { KF_AUTH_ISSUER, KF_AUTH_JWKS_URL, registeredUrl } from '../consoleToken';

/**
 * Signs KF-Console-Tokens with a key made here, and serves its JWKS from a stubbed
 * fetch at KF Auth's JWKS URL, so nothing reaches the network.
 */
export async function stubKfConsole() {
	const kid = randomUUID();
	const { publicKey, privateKey } = await generateKeyPair('EdDSA', {
		crv: 'Ed25519',
		extractable: true,
	});
	const jwk = { ...(await exportJWK(publicKey)), kid, alg: 'EdDSA', use: 'sig' };

	const realFetch = globalThis.fetch;
	const stubJwks = () =>
		vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
			if (String(input) === KF_AUTH_JWKS_URL) {
				return new Response(JSON.stringify({ keys: [jwk] }), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				});
			}
			return realFetch(input, init);
		});

	type Options = { method?: string; path: string; body?: string; claims?: JWTPayload };

	/** A token for the console calling `path`; `claims` override any claim. */
	const sign = ({ method = 'GET', path, body, claims }: Options) => {
		const now = Math.floor(Date.now() / 1000);
		return new SignJWT({
			iss: KF_AUTH_ISSUER,
			aud: 'kf_pubpub',
			sub: 'kf-console',
			iat: now,
			exp: now + 60,
			jti: randomUUID(),
			htm: method,
			htu: registeredUrl(path),
			...(body !== undefined && { body_sha256: sha256Base64Url(body) }),
			...claims,
		})
			.setProtectedHeader({ alg: 'EdDSA', kid })
			.sign(privateKey);
	};

	return { stubJwks, sign };
}

export function sha256Base64Url(body: string): string {
	return createHash('sha256').update(body).digest('base64url');
}
