import { ForbiddenError } from 'server/utils/errors';

import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';

import { createGetRequestIds } from 'utils/getRequestIds';
import { initServer } from '@ts-rest/express';
import { contract } from 'utils/api/contract';
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

extendZodWithOpenApi(z);

const getRequestIds = createGetRequestIds<{
	communityId?: string;
	pubId?: string;
	collectionId?: string;
	collectionPubId?: string;
}>();
const s = initServer();

export const collectionPubServer = s.router(contract.collectionPub, {
	get: async ({ req, query }) => {
		const pubsInCollection = await getPubsInCollection(getRequestIds(query, req.user));
		return {
			status: 200,
			body: pubsInCollection,
		};
	},
	create: async ({ body, req }) => {
		const { collectionId, pubId, userId, communityId } = getRequestIds(body, req.user);
		const { rank, moveToTop } = body;
		const canCreate = await canCreateCollectionPub({
			userId,
			communityId,
			collectionId,
			pubId,
		});
		if (!canCreate) {
			throw new ForbiddenError();
		}
		const collectionPub = await createCollectionPub({
			collectionId,
			pubId,
			rank,
			moveToTop,
			actorId: userId,
		});
		return {
			status: 201,
			// FIXME: Do some checking of whether the contextHint is valid
			body: collectionPub as any,
		};
		// return res.status(201).json(collectionPub);
	},
	update: async ({ req, body }) => {
		const { id: collectionPubId, communityId, userId } = getRequestIds(body, req.user);
		const updatableFields = await getUpdatableFieldsForCollectionPub({
			communityId,
			collectionPubId,
			userId,
		});
		if (!updatableFields) {
			throw new ForbiddenError();
		}
		const updated = await updateCollectionPub(collectionPubId, body, updatableFields);
		return {
			status: 200,
			body: updated,
		};
	},
	remove: async ({ req, body }) => {
		const { id: collectionPubId, communityId, userId } = getRequestIds(body, req.user);
		const canDestroy = await canDestroyCollectionPub({
			communityId,
			collectionPubId,
			userId,
		});
		if (!canDestroy) {
			throw new ForbiddenError();
		}
		await destroyCollectionPub(collectionPubId, userId);
		return {
			status: 200,
			body: body.id,
		};
	},
});
