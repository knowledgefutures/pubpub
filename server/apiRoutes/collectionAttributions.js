import app from '../server';
import { CollectionAttribution, Collection } from '../models';

import permissions from './permissions/permissions';
import makeAttributionsHandler from './handlers/attributions';
import { communityAdminFor } from './permissions/communityAdmin';

const attributionsHandler = makeAttributionsHandler(CollectionAttribution)(
	({ userId, communityId, collectionId }) =>
		permissions.all({
			communityAdmin: communityAdminFor(
				{ userId: userId, communityId: communityId, collectionId: collectionId },
				{ collectionId: [Collection, 'communityId'] },
			),
		}),
);

const credentialsFromRequest = (req) => ({
	collectionId: req.body.collectionId,
	communityId: req.body.communityId,
	userId: req.user.id,
});

app.post('/api/collectionAttributions', (req, res) =>
	attributionsHandler(credentialsFromRequest(req))
		.then(({ createAttribution }) =>
			createAttribution({
				userId: req.body.userId,
				collectionId: req.body.collectionId,
				name: req.body.name,
				order: req.body.order,
				isAuthor: false,
			}),
		)
		.then((created) => res.status(201).json(created))
		.catch((err) => res.status(500).json(err)),
);

app.put('/api/collectionAttributions', (req, res) =>
	attributionsHandler(credentialsFromRequest(req))
		.then(({ updateAttribution }) => updateAttribution(req.body.id, req.body))
		.then((updated) => res.status(201).json(updated))
		.catch((err) => res.status(500).json(err)),
);

app.delete('/api/collectionAttributions', (req, res) =>
	attributionsHandler(credentialsFromRequest(req))
		.then(({ destroyAttribution }) => destroyAttribution(req.body.id))
		.then(() => res.status(201).json(req.body.id))
		.catch((err) => res.status(500).json(err)),
);
