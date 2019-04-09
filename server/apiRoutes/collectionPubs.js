import app from '../server';

import { Collection } from '../models';
import permissions from './permissions';
import makeCollectionPubHandler from './handlers/collectionPubs';
import { communityAdminFor } from './permissions/communityAdmin';

const collectionPubHandler = makeCollectionPubHandler(({ userId, communityId, collectionId }) =>
	permissions.all({
		communityAdmin: communityAdminFor(
			{
				userId: userId,
				communityId: communityId,
				collectionId: collectionId,
			},
			{ collectionId: [Collection, 'communityId'] },
		),
	}),
);

const credentialsFromRequest = (req) => ({
	collectionId: req.body.collectionId,
	communityId: req.body.communityId,
	userId: req.user.id,
});

app.post('/api/collectionPubs', (req, res) =>
	collectionPubHandler(credentialsFromRequest(req))
		.catch((err) => res.status(401).json(err))
		.then(({ createCollectionPub }) =>
			createCollectionPub(req.body.pubId, req.body.collectionId, req.body.rank),
		)
		.then((created) => {
			return res.status(201).json(created);
		})
		.catch(() => res.status(500).json({})),
);

app.put('/api/collectionPubs/setPrimary', (req, res) =>
	collectionPubHandler(credentialsFromRequest(req))
		.catch((err) => res.status(401).json(err))
		.then(({ setCollectionPubAsPrimary }) => setCollectionPubAsPrimary(req.body.id))
		.then((created) => {
			return res.status(201).json(created);
		})
		.catch(() => res.status(500).json({})),
);

app.put('/api/collectionPubs', (req, res) =>
	collectionPubHandler(credentialsFromRequest(req))
		.catch((err) => res.status(401).json(err))
		.then(({ updateCollectionPub }) => updateCollectionPub(req.body.id, req.body))
		.then((updated) => res.status(201).json(updated))
		.catch(() => res.status(500).json({})),
);

app.delete('/api/collectionPubs', (req, res) =>
	collectionPubHandler(credentialsFromRequest(req))
		.catch(() => res.status(401).json({}))
		.then(({ destroyCollectionPub }) => destroyCollectionPub(req.body.id))
		.then(() => res.status(201).json({}))
		.catch(() => {
			res.status(500).json({});
		}),
);
