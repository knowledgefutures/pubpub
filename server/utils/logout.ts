import type { Request, Response } from 'express';

import { isDuqDuq, isProd } from 'utils/environment';

export const logout = (req: Request, res: Response) => {
	res.cookie('gdpr-consent-survives-login', 'no');
	res.cookie('pp-lic', 'pp-lo', {
		...(isProd() && req.hostname.indexOf('pubpub.org') > -1 && { domain: '.pubpub.org' }),
		...(isDuqDuq() && req.hostname.indexOf('pubpub.org') > -1 && { domain: '.duqduq.org' }),
	});
	req.logout();
};
