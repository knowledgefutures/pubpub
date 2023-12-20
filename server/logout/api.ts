import { isDuqDuq, isProd } from 'utils/environment';
import { AppRouteImplementation } from '@ts-rest/express';
import { contract } from 'utils/api/contract';

export const logoutRouteImplementation: AppRouteImplementation<typeof contract.logout> = async ({
	req,
	res,
}) => {
	res.cookie('gdpr-consent-survives-login', 'no');
	res.cookie('pp-lic', 'pp-lo', {
		...(isProd() && req.hostname.indexOf('pubpub.org') > -1 && { domain: '.pubpub.org' }),
		...(isDuqDuq() && req.hostname.indexOf('pubpub.org') > -1 && { domain: '.duqduq.org' }),
	});
	req.logout();

	return { status: 200, body: 'success' } as const;
};
