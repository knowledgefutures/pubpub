import type { AppRouteImplementation } from '@ts-rest/express';

import type { contract } from 'utils/api/contract';

import { isSuspiciousUploadKey } from 'server/spamTag/uploadScamKeywords';
import { addSpamTagToUser } from 'server/spamTag/userQueries';
import { postToSlackAboutSuspiciousUpload } from 'server/utils/slack';

import { getUploadPolicy } from './queries';

export const uploadPolicyRouteImplementation: AppRouteImplementation<
	typeof contract.upload.policy
> = async ({ query, req }) => {
	const uploadPolicy = getUploadPolicy(query);
	const user = req.user as { id: string; email?: string; fullName?: string } | undefined;
	if (user && (query.filename || query.key)) {
		const keyOrName = query.key ?? query.filename ?? '';
		if (isSuspiciousUploadKey(keyOrName)) {
			await addSpamTagToUser(user.id, {
				suspiciousFiles: [`https://assets.pubpub.org/${keyOrName}`],
			})
				.then(() =>
					postToSlackAboutSuspiciousUpload(
						user.id,
						user.email ?? '',
						user.fullName ?? 'Unknown',
						keyOrName,
					),
				)
				.catch(() => {
					// do not block policy response if spam tagging or slack fails
				});
		}
	}
	return {
		status: 200,
		body: uploadPolicy,
	};
};
