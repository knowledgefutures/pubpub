import type { AppRouteImplementation } from '@ts-rest/express';

import type { contract } from 'utils/api/contract';

import { contextFromUser, notify } from 'server/spamTag/notifications';
import { isSuspiciousUploadKey } from 'server/spamTag/uploadScamKeywords';
import { upsertSpamTag } from 'server/spamTag/userQueries';

import { getUploadPolicy } from './queries';

export const uploadPolicyRouteImplementation: AppRouteImplementation<
	typeof contract.upload.policy
> = async ({ query, req }) => {
	const uploadPolicy = getUploadPolicy(query);
	const user = req.user as { id: string; email?: string; fullName?: string } | undefined;
	if (user && (query.filename || query.key)) {
		const keyOrName = query.key ?? query.filename ?? '';
		if (isSuspiciousUploadKey(keyOrName)) {
			await upsertSpamTag({
				userId: user.id,
				fields: { suspiciousFiles: [`https://assets.pubpub.org/${keyOrName}`] },
			})
				.then(({ user: u }) =>
					notify('suspicious-upload', {
						...contextFromUser(u),
						uploadKey: keyOrName,
					}),
				)
				.catch(() => {
					// best-effort, don't block the policy response
				});
		}
	}
	return {
		status: 200,
		body: uploadPolicy,
	};
};
