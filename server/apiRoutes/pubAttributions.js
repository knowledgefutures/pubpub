import app from '../server';
import { PubAttribution, Pub } from '../models';

import permissions from './permissions/permissions';
import makeAttributionsHandler from './handlers/attributions';
import { communityAdminFor } from './permissions/communityAdmin';
import { pubManagerFor } from './permissions/pubManager';

const attributionsHandler = makeAttributionsHandler(PubAttribution)(
	({ pubId, userId, communityId }) =>
		permissions.any({
			communityAdmin: communityAdminFor(
				{ userId: userId, communityId: communityId, pubId: pubId },
				{ pubId: [Pub, 'communityId'] },
			),
			pubManager: pubManagerFor({ userId: userId, pubId: pubId }),
		}),
);

const permissionsObjectFromReq = (req) => ({
	pubId: req.body.pubId,
	communityId: req.body.communityId,
	userId: req.user.id,
});

app.post('/api/pubAttributions', (req, res) =>
	attributionsHandler(permissionsObjectFromReq(req))
		.then(({ createAttribution }) =>
			createAttribution({
				userId: req.body.userId,
				pubId: req.body.pubId,
				name: req.body.name,
				order: req.body.order,
				isAuthor: false,
			}),
		)
		.then((created) => res.status(201).json(created))
		.catch((err) => res.status(500).json(err)),
);

app.put('/api/pubAttributions', (req, res) =>
	attributionsHandler(permissionsObjectFromReq(req))
		.then(({ updateAttribution }) => updateAttribution(req.body.id, req.body))
		.then((updated) => res.status(201).json(updated))
		.catch((err) => res.status(500).json(err)),
);

app.delete('/api/pubAttributions', (req, res) =>
	attributionsHandler(permissionsObjectFromReq(req))
		.then(({ destroyAttribution }) => destroyAttribution(req.body.id))
		.then(() => res.status(201).json(req.body.id))
		.catch((err) => res.status(500).json(err)),
);
