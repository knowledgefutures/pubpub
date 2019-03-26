import app from '../server';
import { Collection } from '../models';
import permissions from './permissions';
import { communityAdminFor } from './permissions/communityAdmin';
import makeCollectionsHandler from './handlers/collections';

const collectionsHandler = makeCollectionsHandler(({ userId, collectionId, communityId }) =>
	permissions.all({
		communityAdmin: communityAdminFor(
			{ userId: userId, communityId: communityId, collectionId: collectionId },
			{ collectionId: collectionId && [Collection, 'communityId'] },
		),
	}),
);

const credentialsFromRequest = (req) => ({
	collectionId: req.body.id,
	communityId: req.body.communityId,
	userId: req.user.id,
});

app.post('/api/collections', (req, res) =>
	collectionsHandler(credentialsFromRequest(req))
		.catch(() => res.status(401).send({}))
		.then(({ createCollection }) =>
			createCollection(req.body.title, req.body.kind, req.body.communityId),
		)
		.then((newCollection) => res.status(201).json(newCollection))
		.catch((err) => res.status(500).json(err)),
);

app.put('/api/collections', (req, res) =>
	collectionsHandler(credentialsFromRequest(req))
		.catch(() => res.status(401).send({}))
		.then(({ updateCollection }) => updateCollection(req.body.id, req.body))
		.then((updatedCollection) => res.status(201).json(updatedCollection))
		.catch((err) => res.status(500).json(err)),
);

app.delete('/api/collections', (req, res) =>
	collectionsHandler(credentialsFromRequest(req))
		.catch(() => res.status(401).send({}))
		.then(({ destroyCollection }) => destroyCollection(req.body.id))
		.then(() => res.status(201).json({}))
		.catch((err) => res.status(500).json(err)),
);
