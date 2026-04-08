import xmlbuilder from 'xmlbuilder';

import { getCommunityDepositTarget } from 'server/depositTarget/queries';
import { env } from 'server/env';
import { expect } from 'utils/assert';
import { aes256Decrypt } from 'utils/crypto';

const getDoiLogin = async (communityId: string) => {
	const depositTarget = await getCommunityDepositTarget(communityId, true);
	if (depositTarget) {
		const { username, password, passwordInitVec } = depositTarget;
		if (username && password && passwordInitVec) {
			return {
				login: username,
				password: aes256Decrypt(password, expect(env.AES_ENCRYPTION_KEY), passwordInitVec),
			};
		}
	}
	return {
		login: env.DOI_LOGIN_ID,
		password: env.DOI_LOGIN_PASSWORD,
	};
};

export const submitDoiData = async (
	json: Record<string, object>,
	timestamp: number,
	communityId: string,
) => {
	const DOI_SUBMISSION_URL = env.DOI_SUBMISSION_URL;

	if (!DOI_SUBMISSION_URL) {
		throw new Error('DOI_SUBMISSION_URL environment variable not set');
	}

	const { login, password } = await getDoiLogin(communityId);
	const xmlObject = xmlbuilder.create(json, { headless: true }).end({ pretty: true });

	const formData = new FormData();
	formData.append('login_id', login ?? '');
	formData.append('login_passwd', password ?? '');
	formData.append(
		'fname',
		new Blob([xmlObject], { type: 'application/xml' }),
		`${timestamp}.xml`,
	);

	const response = await fetch(DOI_SUBMISSION_URL, {
		method: 'POST',
		body: formData,
		headers: {
			'user-agent': 'PubPub (mailto:hello@pubpub.org)',
		},
	});

	const body = await response.text();
	if (!response.ok) {
		throw new Error(`DOI submission failed (${response.status}): ${body}`);
	}
	return body;
};
