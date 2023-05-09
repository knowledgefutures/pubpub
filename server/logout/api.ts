import app from 'server/server';

import { isDuqDuq, isProd } from 'utils/environment';

app.get('/api/logout', (req, res) => {
	res.cookie('gdpr-consent-survives-login', 'no');
	res.cookie('pp-cache', 'pp-cache', {
		...(isProd() && req.hostname.indexOf('pubpub.org') > -1 && { domain: '.pubpub.org' }),
		...(isDuqDuq() && req.hostname.indexOf('pubpub.org') > -1 && { domain: '.duqduq.org' }),
	});
	// @ts-expect-error
	req.logout();
	return res.status(200).json('success');
});
