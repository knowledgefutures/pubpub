import app from '../server';
import { findPub } from '../queryHelpers';
import { getInitialData } from '../utilities';

// TODO(ian): add some kind of authentication here
app.get('/api/citations', (req, res) => {
	const { slug, versionId } = req.query;
	getInitialData(req)
		.then((initialData) => {
			return findPub(
				{
					query: { version: versionId },
					params: { slug: slug },
				},
				initialData,
			);
		})
		.then((pubData) => {
			return res.status(201).json({
				citationData: pubData.citationData,
			});
		})
		.catch((err) => {
			console.error('Error generating citations', err);
			return res.status(500).json(err);
		});
});
