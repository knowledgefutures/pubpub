import type * as types from 'types';

import xmlbuilder from 'xmlbuilder';

import { getCommunityDepositTarget } from 'server/depositTarget/queries';
import { env } from 'server/env';
import { expect } from 'utils/assert';
import { aes256Decrypt } from 'utils/crypto';

// ---------------------------------------------------------------------------
// Shared credential + submission helpers
// ---------------------------------------------------------------------------

/**
 * Resolves Crossref credentials from a DepositTarget (or falls back to env).
 * Exported so that callers with a pre-fetched DepositTarget (e.g. community
 * deletion, where the community is about to be destroyed) can use the same
 * credential logic without looking up the community again.
 */
export const resolveCrossrefCredentials = (depositTarget: types.DepositTarget | null) => {
	if (depositTarget?.username && depositTarget?.password && depositTarget?.passwordInitVec) {
		return {
			login: depositTarget.username,
			password: aes256Decrypt(
				depositTarget.password,
				expect(env.AES_ENCRYPTION_KEY),
				depositTarget.passwordInitVec,
			),
		};
	}
	return {
		login: env.DOI_LOGIN_ID ?? '',
		password: env.DOI_LOGIN_PASSWORD ?? '',
	};
};

/**
 * Low-level POST to Crossref's deposit endpoint. Both full-metadata deposits
 * and bulk URL updates use the same endpoint — they differ only in the
 * operation parameter and file format.
 */
export const postToCrossref = async (opts: {
	content: string;
	contentType: string;
	filename: string;
	credentials: { login: string; password: string };
	/** Defaults to doMDUpload (full metadata deposit). */
	operation?: string;
}) => {
	const submissionUrl = env.DOI_SUBMISSION_URL;
	if (!submissionUrl) {
		throw new Error('DOI_SUBMISSION_URL environment variable not set');
	}

	const { content, contentType, filename, credentials, operation = 'doMDUpload' } = opts;

	const formData = new FormData();
	formData.append('operation', operation);
	formData.append('login_id', credentials.login);
	formData.append('login_passwd', credentials.password);
	formData.append('fname', new Blob([content], { type: contentType }), filename);

	const response = await fetch(submissionUrl, {
		method: 'POST',
		body: formData,
		headers: { 'user-agent': 'PubPub (mailto:hello@pubpub.org)' },
	});

	const body = await response.text();
	if (!response.ok) {
		throw new Error(`Crossref submission failed (${response.status}): ${body}`);
	}
	return body;
};

// ---------------------------------------------------------------------------
// Full metadata deposit
// ---------------------------------------------------------------------------

const getDoiLogin = async (communityId: string) => {
	const depositTarget = (await getCommunityDepositTarget(communityId, true)) ?? null;
	return resolveCrossrefCredentials(depositTarget);
};

export const submitDoiData = async (
	json: Record<string, object>,
	timestamp: number,
	communityId: string,
) => {
	const credentials = await getDoiLogin(communityId);
	const xmlContent = xmlbuilder.create(json, { headless: true }).end({ pretty: true });

	return postToCrossref({
		content: xmlContent,
		contentType: 'application/xml',
		filename: `${timestamp}.xml`,
		credentials,
	});
};
