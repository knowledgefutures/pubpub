import app, { wrap } from 'server/server';
import { ForbiddenError } from 'server/utils/errors';

import {
	canCreateCollectionPub,
	canDestroyCollectionPub,
	getUpdatableFieldsForCollectionPub,
} from './permissions';
import {
	createCollectionPub,
	updateCollectionPub,
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
		const canCreate = await canCreateCollectionPub({
			userId: userId,
			communityId: communityId,
			collectionId: collectionId,
			pubId: pubId,
		});
		if (!canCreate) {
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
	'/api/collectionPubs',
	wrap(async (req, res) => {
		const { collectionPubId, communityId, userId } = getRequestIds(req);
		const updatableFields = await getUpdatableFieldsForCollectionPub({
			communityId: communityId,
			collectionPubId: collectionPubId,
			userId: userId,
		});
		if (!updatableFields) {
			throw new ForbiddenError();
		}
		const updated = await updateCollectionPub(collectionPubId, req.body, updatableFields);
		return res.status(200).json(updated);
	}),
);

app.delete(
	'/api/collectionPubs',
	wrap(async (req, res) => {
		const { collectionPubId, communityId, userId } = getRequestIds(req);
		const canDestroy = await canDestroyCollectionPub({
			communityId: communityId,
			collectionPubId: collectionPubId,
			userId: userId,
		});
		if (!canDestroy) {
			throw new ForbiddenError();
		}
		await destroyCollectionPub(collectionPubId);
		return res.status(200).json(req.body.id);
	}),
);
