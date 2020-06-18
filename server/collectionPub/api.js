import app, { wrap } from 'server/server';
import { ForbiddenError } from 'server/utils/errors';

import { getPermissions } from './permissions';
import {
	createCollectionPub,
	updateCollectionPub,
	setPrimaryCollectionPub,
	destroyCollectionPub,
	getPubsInCollection,
} from './queries';

const getRequestIds = (req, argsFrom = req.body) => {
	const user = req.user || {};
	return {
		userId: user.id,
		pubId: argsFrom.pubId || null,
		collectionId: argsFrom.collectionId,
		communityId: argsFrom.communityId,
		collectionPubId: argsFrom.id,
	};
};

app.get(
	'/api/collectionPubs',
	wrap(async (req, res) => {
		const pubsInCollection = await getPubsInCollection(getRequestIds(req, req.query));
		return res.status(200).json(pubsInCollection);
	}),
);

app.post(
	'/api/collectionPubs',
	wrap(async (req, res) => {
		const { collectionId, pubId, userId, communityId } = getRequestIds(req);
		const { rank, moveToTop } = req.body;
		const permissions = await getPermissions({
			communityId: communityId,
			collectionId: collectionId,
			userId: userId,
		});
		if (!permissions.create) {
			throw new ForbiddenError();
		}
		const collectionPub = await createCollectionPub({
			collectionId: collectionId,
			pubId: pubId,
			rank: rank,
			moveToTop: moveToTop,
		});
		return res.status(201).json(collectionPub);
	}),
);

app.put(
	'/api/collectionPubs/setPrimary',
	wrap(async (req, res) => {
		const { isPrimary } = req.body;
		const { collectionPubId, communityId, collectionId, userId } = getRequestIds(req);
		const permissions = await getPermissions({
			communityId: communityId,
			collectionId: collectionId,
			userId: userId,
		});
		if (!permissions.create) {
			throw new ForbiddenError();
		}
		const updated = await setPrimaryCollectionPub({
			collectionPubId: collectionPubId,
			isPrimary: isPrimary,
		});
		return res.status(200).json(updated);
	}),
);

app.put(
	'/api/collectionPubs',
	wrap(async (req, res) => {
		const { collectionPubId, communityId, collectionId, userId } = getRequestIds(req);
		const permissions = await getPermissions({
			communityId: communityId,
			collectionId: collectionId,
			userId: userId,
		});
		if (!permissions.create) {
			throw new ForbiddenError();
		}
		const updated = await updateCollectionPub(
			{ ...req.body, collectionPubId: collectionPubId },
			permissions.update,
		);
		return res.status(200).json(updated);
	}),
);

app.delete(
	'/api/collectionPubs',
	wrap(async (req, res) => {
		const { collectionPubId, communityId, collectionId, userId } = getRequestIds(req);
		const permissions = await getPermissions({
			communityId: communityId,
			collectionId: collectionId,
			userId: userId,
		});
		if (!permissions.create) {
			throw new ForbiddenError();
		}
		await destroyCollectionPub({ collectionPubId: collectionPubId });
		return res.status(200).json(req.body.id);
	}),
);
