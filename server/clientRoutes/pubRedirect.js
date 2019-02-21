import app from '../server';
import { Community, Pub } from '../models';
import { hostIsValid, handleErrors } from '../utilities';

app.get('/pub/:slug', (req, res, next) => {
	if (!hostIsValid(req, 'pubpub')) {
		return next();
	}

	return Pub.findOne({
		where: {
			slug: req.params.slug.replace(/_/gi, '-').toLowerCase(),
		},
		attributes: ['id'],
		include: [
			{
				model: Community,
				as: 'community',
				attributes: ['subdomain', 'domain'],
			},
		],
	})
		.then((pubData) => {
			if (pubData) {
				const newDomain = pubData.community.domain
					? pubData.community.domain
					: `${pubData.community.subdomain}.pubpub.org`;
				return res.redirect(
					`https://${newDomain}/pub/${req.params.slug.replace(/_/gi, '-')}`,
				);
			}
			return res.redirect(`https://v3.pubpub.org/pub/${req.params.slug}`);
		})
		.catch(handleErrors(req, res, next));
});
