import type { AppRouteImplementation } from '@ts-rest/express';

import type { contract } from 'utils/api/contract';

import { logout } from 'server/utils/logout';

export const logoutRouteImplementation: AppRouteImplementation<
	typeof contract.auth.logout
> = async ({ req, res }) => {
	logout(req, res);
	return { status: 200, body: 'success' } as const;
};
