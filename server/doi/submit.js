import { Readable } from 'stream';
import request from 'request-promise';
import xmlbuilder from 'xmlbuilder';

import { getDoiOverrideByCommunityId } from 'utils/crossref/communities';

const getDoiLogin = (communityId) => {
	const doiOverride = getDoiOverrideByCommunityId(communityId);
	if (doiOverride) {
		const { key } = doiOverride;
		return {
			login: process.env[`${key}_DOI_LOGIN_ID`],
			password: process.env[`${key}_DOI_LOGIN_PASSWORD`],
		};
	}
	return {
		login: process.env.DOI_LOGIN_ID,
		password: process.env.DOI_LOGIN_PASSWORD,
	};
};

export const submitDoiData = (json, timestamp, communityId) => {
	const { DOI_SUBMISSION_URL } = process.env;
	const { login, password } = getDoiLogin(communityId);
	const xmlObject = xmlbuilder.create(json, { headless: true }).end({ pretty: true });
	const readStream = new Readable();
	// eslint-disable-next-line no-underscore-dangle
	readStream._read = function noop() {};
	readStream.push(xmlObject);
	readStream.push(null);
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
