import app from '../server';
import { Collection, CollectionPub } from '../models';

import { withCommunityAdmin } from './permissions/communityAdmin';

app.post(
	'/api/collectionPubs/legacy',
	withCommunityAdmin((req, res) => {
		/* If the collection is being created from the pub, create the Collection first */
		const collectionPromise =
			!req.body.collectionId && req.body.title
				? Collection.create({
						kind: req.body.kind,
						title: req.body.title.trim(),
						isRestricted: true,
						isPublic: true,
						communityId: req.body.communityId,
				  })
				: Promise.resolve();
		return collectionPromise
			.then((newCollection) => {
				return CollectionPub.create({
					pubId: req.body.pubId,
					collectionId: req.body.collectionId || newCollection.id,
				});
			})
			.then((newCollectionPub) => {
				return CollectionPub.findOne({
					where: { id: newCollectionPub.id },
					include: [{ model: Collection, as: 'collection' }],
				});
			})
			.then((newCollectionPubData) => {
				return res.status(201).json(newCollectionPubData);
			})
			.catch((err) => {
				return res.status(500).json(err.message);
			});
	}),
);

app.delete(
	'/api/collectionPubs/legacy',
	withCommunityAdmin((req, res) => {
		return CollectionPub.destroy({
			where: { id: req.body.pubCollectionId },
		})
			.then(() => {
				return res.status(201).json(req.body.pubCollectionId);
			})
			.catch((err) => {
				return res.status(500).json(err.message);
			});
	}),
);
