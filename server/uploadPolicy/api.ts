import type { AppRouteImplementation } from '@ts-rest/express';

import type { contract } from 'utils/api/contract';

import { contextFromUser, notify } from 'server/spamTag/notifications';
import { isSuspiciousUploadKey } from 'server/spamTag/uploadScamKeywords';
import { upsertSpamTag } from 'server/spamTag/userQueries';
import { BadRequestError, ForbiddenError } from 'server/utils/errors';

import { getUploadPolicy } from './queries';

const contentTypePattern = /^[\w.+-]+\/[\w.+-]+$/;

const isOwnKey = (key: string, userId: string) =>
	new RegExp(`^(_testing/)?c[^/]+(/p[^/]+)?/u${userId}/[^/]+$`).test(key);

export const uploadPolicyRouteImplementation: AppRouteImplementation<
	typeof contract.upload.policy
> = async ({ query, req }) => {
	const user = req.user as { id: string; email?: string; fullName?: string } | undefined;
	if (!user?.id) {
		throw new ForbiddenError(new Error('User not found'));
	}
	if (!contentTypePattern.test(query.contentType)) {
		throw new BadRequestError(new Error('Invalid content type'));
	}
	if (!isOwnKey(query.key, user.id)) {
		throw new BadRequestError(new Error('Invalid key'));
	}
	const uploadPolicy = getUploadPolicy(query);
	if (isSuspiciousUploadKey(query.key)) {
		await upsertSpamTag({
			userId: user.id,
			fields: { suspiciousFiles: [`https://assets.pubpub.org/${query.key}`] },
		})
			.then(({ user: u }) =>
				notify('suspicious-upload', {
					...contextFromUser(u),
					uploadKey: query.key,
				}),
			)
			.catch(() => {
				// best-effort, don't block the policy response
			});
	}
	return {
		status: 200,
		body: uploadPolicy,
	};
};
