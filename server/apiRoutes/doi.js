import app from '../server';
import { setDoiData } from './handlers/doi';

import { pubManagerFor } from './permissions/pubManager';
import { communityAdminFor } from './permissions/communityAdmin';

app.post('/api/doi/:target', (req, res) => {
	const userId = req.user.id;
	const { pubId, collectionId, communityId } = req.body;
	const { target } = req.params;
	const setData = () =>
		setDoiData(
			{
				communityId: communityId,
				collectionId: collectionId,
				pubId: pubId,
			},
			target,
		);
	return communityAdminFor({ communityId: communityId, userId: userId })
		.then((communityAdmin) => {
			if (target === 'pub') {
				// Both community admins and pub managers can manage pub DOIs
				if (communityAdmin) {
					return setData();
				}
				return pubManagerFor({ userId: userId, pubId: pubId }).then((pubManager) => {
					if (pubManager) {
						return setData();
					}
					return res.status(401).send({});
				});
			}
			if (target === 'collection') {
				// Community admins can manage collection DOIs
				if (communityAdmin) {
					return setData();
				}
				return res.status(401).send({});
			}
			throw new Error('Invalid DOI target');
		})
		.then((json) => res.status(201).json(json))
		.catch((err) => {
			res.status(500).json(err);
		});
});
