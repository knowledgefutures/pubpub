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
		.catch(() => null)
		.then((maybeCommunityAdmin) => {
			if (target === 'pub') {
				// Both community admins and pub managers can manage pub DOIs
				if (maybeCommunityAdmin) {
					return setData();
				}
				return pubManagerFor({ userId: userId, pubId: pubId })
					.catch(() => null)
					.then((maybePubManager) => {
						if (maybePubManager) {
							return setData();
						}
						return res.status(401).send({});
					});
			}
			if (target === 'collection') {
				// Community admins can manage collection DOIs
				if (maybeCommunityAdmin) {
					return setData();
				}
				return res.status(401).send({});
			}
			throw new Error('Invalid DOI target');
		})
		.then((json) => res.status(201).json(json))
		.catch((err) => res.status(500).json(err));
});
