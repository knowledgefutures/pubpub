import app from '../server';

app.use((req, res, next) => {
	const redirectHosts = {
		'www.pubpub.org': {
			'/iai': 'https://v3.pubpub.org/iai',
		},
		'pubpub.ito.com': {
			'/pub/resisting-reduction': 'https://jods.mitpress.mit.edu/pub/resisting-reduction',
		},
		'bookbook.pubpub.org': {
			'/pub/oki': 'https://wip.mitpress.mit.edu/pub/oki',
			'/oki': 'https://wip.mitpress.mit.edu/oki',
		},
		'kfg.mit.edu': {
			'/': 'https://www.knowledgefutures.org',
			'*': 'https://notes.knowledgefutures.org$1',
		},
		'blog.pubpub.org': {
			'*': 'https://notes.knowledgefutures.org$1',
		},
		'commonplace.pubpub.org': {
			'/pub/y6zaxybl': 'https://notes.knowledgefutures.org/pub/y6zaxybl',
			'/pub/zmxeo3dv': 'https://notes.knowledgefutures.org/pub/zmxeo3dv',
			'/pub/ek9zpak0': 'https://notes.knowledgefutures.org/pub/ek9zpak0',
		},
	};

	const hostValues = redirectHosts[req.hostname];
	if (hostValues) {
		const pathValue = hostValues[req.path];
		if (pathValue) {
			return res.redirect(pathValue);
		}
		const catchAllValue = hostValues['*'];
		if (catchAllValue) {
			return res.redirect(catchAllValue.replace('$1', req.path));
		}
	}
	return next();
});
