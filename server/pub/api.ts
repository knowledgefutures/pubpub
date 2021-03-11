import app, { wrap } from 'server/server';
import { ForbiddenError } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { indexByProperty } from 'utils/arrays';
import { PubsQuery } from 'utils/types';

import { canCreatePub, getUpdatablePubFields, canDestroyPub } from './permissions';
import { createPub, updatePub, destroyPub } from './queries';
import { queryPubIds, getPubsById } from './queryMany';

type ManyRequestParams = { query: Omit<PubsQuery, 'communityId'>; alreadyFetchedPubIds: string[] };

const getManyQueryParams = (req): ManyRequestParams => {
	const { query, alreadyFetchedPubIds } = req.body;
	const {
		collectionIds,
		excludePubIds,
		isReleased,
		limit = 50,
		offset = 0,
		ordering,
		scopedCollectionId,
		withinPubIds,
		term,
	} = query;
	return {
		alreadyFetchedPubIds,
		query: {
			collectionIds,
			excludePubIds,
			isReleased,
			limit,
			offset,
			ordering,
			scopedCollectionId,
			withinPubIds,
			term,
		},
	};
};

app.post(
	'/api/pubs/many',
	wrap(async (req, res) => {
		const initialData = await getInitialData(req);
		const { query: queryPartial, alreadyFetchedPubIds } = getManyQueryParams(req);
		const { limit } = queryPartial;
		const pubIds = await queryPubIds({
			...queryPartial,
			communityId: initialData.communityData.id,
		});
		const loadedAllPubs = limit && limit > pubIds.length;
		const idsToFetch = pubIds.filter((id) => !alreadyFetchedPubIds.includes(id));
		const pubs = await getPubsById(idsToFetch).sanitize(initialData);
		return res
			.status(200)
			.json({ pubIds, pubsById: indexByProperty(pubs, 'id'), loadedAllPubs });
	}),
);

const getRequestIds = (req) => {
	const user = req.user || {};
	const { communityId, collectionId, pubId, licenseSlug, createPubToken } = req.body;
	return {
		userId: user.id,
		communityId,
		collectionId,
		createPubToken,
		pubId,
		licenseSlug,
	};
};

app.post(
	'/api/pubs',
	wrap(async (req, res) => {
		const { userId, collectionId, communityId, createPubToken } = getRequestIds(req);
		const { create, collectionIds } = await canCreatePub({
			userId,
			collectionId,
			communityId,
			createPubToken,
		});
		if (create) {
			const newPub = await createPub(
				// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ communityId: any; collectionId... Remove this comment to see the full error message
				{ communityId, collectionIds },
				userId,
			);
			return res.status(201).json(newPub);
		}
		throw new ForbiddenError();
	}),
);

app.put(
	'/api/pubs',
	wrap(async (req, res) => {
		const { userId, pubId, licenseSlug } = getRequestIds(req);
		const updatableFields = await getUpdatablePubFields({
			userId,
			pubId,
			licenseSlug,
		});
		if (updatableFields) {
			const updateResult = await updatePub(req.body, updatableFields);
			return res.status(200).json(updateResult);
		}
		throw new ForbiddenError();
	}),
);
app.delete(
	'/api/pubs',
	wrap(async (req, res) => {
		const { userId, pubId } = getRequestIds(req);
		const canDestroy = await canDestroyPub({ userId, pubId });
		if (canDestroy) {
			await destroyPub(pubId);
			return res.status(200).json({});
		}
		throw new ForbiddenError();
	}),
);
