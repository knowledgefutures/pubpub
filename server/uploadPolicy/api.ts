import type { AppRouteImplementation } from '@ts-rest/express';

import type { contract } from 'utils/api/contract';

import { getUploadPolicy } from './queries';

export const uploadPolicyRouteImplementation: AppRouteImplementation<
	typeof contract.upload.policy
> = async ({ query }) => {
	const uploadPolicy = getUploadPolicy(query);
	return {
		status: 200,
		body: uploadPolicy,
	};
};
