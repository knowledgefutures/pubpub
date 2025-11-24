import type { AppRouteImplementation } from '@ts-rest/express';

import type { contract } from 'utils/api/contract';

import { isDuqDuq, isProd } from 'utils/environment';

export const logoutRouteImplementation: AppRouteImplementation<
	typeof contract.auth.logout
> = async ({ req, res }) => {
	res.cookie('gdpr-consent-survives-login', 'no');
	res.cookie('pp-lic', 'pp-lo', {
		...(isProd() && req.hostname.indexOf('pubpub.org') > -1 && { domain: '.pubpub.org' }),
		...(isDuqDuq() && req.hostname.indexOf('pubpub.org') > -1 && { domain: '.duqduq.org' }),
	});
	req.logout();

	return { status: 200, body: 'success' } as const;
};
