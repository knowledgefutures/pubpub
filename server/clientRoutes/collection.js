import app from '../server';
import { Collection } from '../models';
import { hostIsValid } from '../utilities';

app.get('/collection/:id', (req, res, next) => {
	const { id } = req.params;
	if (!hostIsValid(req, 'community')) {
		return next();
	}
	return Collection.findOne({ where: { id: id } }).then((collection) =>
		res.redirect(`/search?q=${collection.title}`),
	);
});
