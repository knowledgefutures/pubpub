import request from 'request-promise';
import { Readable } from 'stream';
import xmlbuilder from 'xmlbuilder';

import { getCommunityDepositTarget } from 'server/depositTarget/queries';
import { expect } from 'utils/assert';
import { aes256Decrypt } from 'utils/crypto';

const getDoiLogin = async (communityId: string) => {
	const depositTarget = await getCommunityDepositTarget(communityId, true);
	if (depositTarget) {
		const { username, password, passwordInitVec } = depositTarget;
		if (username && password && passwordInitVec) {
			return {
				login: username,
				password: aes256Decrypt(
					password,
					expect(process.env.AES_ENCRYPTION_KEY),
					passwordInitVec,
				),
			};
		}
	}
	return {
		login: process.env.DOI_LOGIN_ID,
		password: process.env.DOI_LOGIN_PASSWORD,
	};
};

export const submitDoiData = async (
	json: Record<string, object>,
	timestamp: number,
	communityId: string,
) => {
	const { DOI_SUBMISSION_URL } = process.env;

	if (!DOI_SUBMISSION_URL) {
		throw new Error('DOI_SUBMISSION_URL environment variable not set');
	}

	const { login, password } = await getDoiLogin(communityId);
	const xmlObject = xmlbuilder.create(json, { headless: true }).end({ pretty: true });
	const readStream = new Readable();

	readStream._read = function noop() {};
	readStream.push(xmlObject);
	readStream.push(null);
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'path' does not exist on type 'Readable'.
	readStream.path = `/${timestamp}.xml`;
	return request({
		method: 'POST',
		url: DOI_SUBMISSION_URL,
		formData: {
			login_id: login,
			login_passwd: password,
			fname: readStream,
		},
		headers: {
			'content-type': 'multipart/form-data',
			'user-agent': 'PubPub (mailto:hello@pubpub.org)',
		},
	});
};
