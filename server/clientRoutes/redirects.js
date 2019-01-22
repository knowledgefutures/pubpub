import app from '../server';
import { hostIsValid } from '../utilities';

app.get('/iai', (req, res, next)=> {
	if (!hostIsValid(req, 'pubpub')) { return next(); }
	return res.redirect('https://v3.pubpub.org/iai');
});

const setRedirect = (oldHostname, oldPath, newUrl)=> {
	app.get(oldPath, (req, res, next)=> {
		if (req.hostname === oldHostname) {
			return res.redirect(newUrl);
		}
		return next();
	});
};

setRedirect('pubpub.ito.com', '/pub/resisting-reduction', 'https://jods.mitpress.mit.edu/pub/resisting-reduction');
setRedirect('bookbook.pubpub.org', '/pub/oki', 'https://wip.mitpress.mit.edu/pub/oki');
setRedirect('bookbook.pubpub.org', '/oki', 'https://wip.mitpress.mit.edu/oki');
