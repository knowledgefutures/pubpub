import app from '../server';
import { Collection, sequelize } from '../models';
import { hostIsValid } from '../utilities';

app.get('/collection/:slug', (req, res, next) => {
	const { slug } = req.params;
	if (!hostIsValid(req, 'community')) {
		return next();
	}
	return Collection.findOne({
		where: [
			{ isPublic: true },
			sequelize.where(sequelize.cast(sequelize.col('Collection.id'), 'varchar'), {
				$ilike: `${slug}%`,
			}),
		],
	})
		.then((collection) => {
			if (collection) {
				res.redirect(`/search?q=${collection.title}`);
			} else {
				res.status(404).json('Collection not found');
			}
		})
		.catch((err) => res.status(500).json(err));
});
