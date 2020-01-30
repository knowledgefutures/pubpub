import app from '../server';
import { hostIsValid } from '../utils';

app.get('/iai', (req, res, next) => {
	if (!hostIsValid(req, 'pubpub')) {
		return next();
	}
	return res.redirect('https://v3.pubpub.org/iai');
});

const setRedirect = (oldHostname, oldPath, newUrl) => {
	app.get(oldPath, (req, res, next) => {
		if (req.hostname === oldHostname) {
			return res.redirect(newUrl);
		}
		return next();
	});
};

setRedirect(
	'pubpub.ito.com',
	'/pub/resisting-reduction',
	'https://jods.mitpress.mit.edu/pub/resisting-reduction',
);
setRedirect('bookbook.pubpub.org', '/pub/oki', 'https://wip.mitpress.mit.edu/pub/oki');
setRedirect('bookbook.pubpub.org', '/oki', 'https://wip.mitpress.mit.edu/oki');
setRedirect('kfg.mit.edu', '/', 'https://www.knowledgefutures.org');
setRedirect('blog.pubpub.org', '/', 'https://notes.knowledgefutures.org');
setRedirect('commonplace.pubpub.org', '/', 'https://commonplace.knowledgefutures.org');
setRedirect('kfg.mit.edu', '/pub/3jhmyfk5', 'https://notes.knowledgefutures.org/pub/3jhmyfk5');
setRedirect(
	'commonplace.pubpub.org',
	'/pub/y6zaxybl',
	'https://notes.knowledgefutures.org/pub/y6zaxybl',
);
setRedirect(
	'commonplace.pubpub.org',
	'/pub/zmxeo3dv',
	'https://notes.knowledgefutures.org/pub/zmxeo3dv',
);
setRedirect(
	'commonplace.pubpub.org',
	'/pub/ek9zpak0',
	'https://notes.knowledgefutures.org/pub/ek9zpak0',
);
setRedirect('blog.pubpub.org', '/pub/ek9zpak0', 'https://notes.knowledgefutures.org/pub/ek9zpak0');
setRedirect(
	'blog.pubpub.org',
	'/pub/kzujjdx8',
	'https://commonplace.knowledgefutures.org/pub/kzujjdx8',
);
