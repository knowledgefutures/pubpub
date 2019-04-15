import app from '../server';
import { findPub } from '../queryHelpers';
import { getInitialData } from '../utilities';

app.get('/api/citations', (req, res) => {
	const { slug, versionId } = req.query;
	getInitialData(req)
		.then((initialData) => {
			// Authentication is delegated to findPub here
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
