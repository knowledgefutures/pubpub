import { Op } from 'sequelize';

import app from 'server/server';
import { Collection, sequelize, Page } from 'server/models';
import { hostIsValid } from 'server/utils/routes';

app.get('/collection/:slug', (req, res, next) => {
	const { slug } = req.params;
	if (!hostIsValid(req, 'community')) {
		return next();
	}
	return Collection.findOne({
		where: [
			{ isPublic: true },
			sequelize.where(sequelize.cast(sequelize.col('Collection.id'), 'varchar'), {
				[Op.iLike]: `${slug}%`,
			}),
		],
		include: [{ model: Page, as: 'page', attributes: ['slug'] }],
	})
		.then((collection) => {
			if (collection) {
				if (collection.page) {
					res.redirect('/' + collection.page.slug);
				} else {
					res.redirect(`/search?q=${collection.title}`);
				}
			} else {
				res.status(404).json('Collection not found');
			}
		})
		.catch((err) => res.status(500).json(err));
});
