import app, { wrap } from 'server/server';
import { ForbiddenError, NotFoundError } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { PubGetOptions, PubsQuery } from 'types';
import { indexByProperty } from 'utils/arrays';
import { transformPubToResource } from 'deposit/transform/pub';
import { generateDoi } from 'server/doi/queries';
import { assert, expect } from 'utils/assert';
import { prepareResource, submitResource } from 'deposit/datacite/deposit';
import { assertValidResource } from 'deposit/validate';

import { canCreatePub, canDestroyPub, getUpdatablePubFields } from './permissions';
import { createPub, destroyPub, findPub, updatePub } from './queries';
import { getPubsById, queryPubIds } from './queryMany';

type ManyRequestParams = {
	query: Omit<PubsQuery, 'communityId'>;
	alreadyFetchedPubIds: string[];
	pubOptions: PubGetOptions;
};

const getManyQueryParams = (req): ManyRequestParams => {
	const { query, alreadyFetchedPubIds, pubOptions = {} } = req.body;
	const {
		collectionIds,
		excludeCollectionIds,
		excludePubIds,
		isReleased,
		limit = 50,
		offset = 0,
		ordering,
		scopedCollectionId,
		withinPubIds,
		term,
		submissionStatuses,
		relatedUserIds,
	} = query;
	return {
		pubOptions,
		alreadyFetchedPubIds,
		query: {
			collectionIds,
			excludeCollectionIds,
			excludePubIds,
			isReleased,
			limit,
			offset,
			ordering,
			scopedCollectionId,
			withinPubIds,
			term,
			submissionStatuses,
			relatedUserIds,
		},
	};
};

app.post(
	'/api/pubs/many',
	wrap(async (req, res) => {
		const initialData = await getInitialData(req);
		const { query: queryPartial, alreadyFetchedPubIds, pubOptions } = getManyQueryParams(req);
		const { limit } = queryPartial;
		const pubIds = await queryPubIds({
			...queryPartial,
			communityId: initialData.communityData.id,
		});
		const loadedAllPubs = limit && limit > pubIds.length;
		const idsToFetch = pubIds.filter((id) => !alreadyFetchedPubIds.includes(id));
		const pubs = await getPubsById(idsToFetch, pubOptions).sanitize(initialData);
		const pubsById = indexByProperty(pubs, 'id');
		return res.status(200).json({
			pubIds: pubIds.filter((id) => !!pubsById[id] || alreadyFetchedPubIds.includes(id)),
			pubsById,
			loadedAllPubs,
		});
	}),
);

const getRequestIds = (req) => {
	const user = req.user || {};
	const { communityId, collectionId, pubId, createPubToken } = req.body;
	return {
		userId: user.id,
		communityId,
		collectionId,
		createPubToken,
		pubId,
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
			const newPub = await createPub({ communityId, collectionIds }, userId);
			return res.status(201).json(newPub);
		}
		throw new ForbiddenError();
	}),
);

app.put(
	'/api/pubs',
	wrap(async (req, res) => {
		const { userId, pubId } = getRequestIds(req);
		const updatableFields = await getUpdatablePubFields({
			userId,
			pubId,
		});
		if (updatableFields) {
			const updateResult = await updatePub(req.body, updatableFields, userId);
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
			await destroyPub(pubId, userId);
			return res.status(200).json({});
		}
		throw new ForbiddenError();
	}),
);

app.get(
	'/api/pub/:pubId/resource',
	wrap(async (req, res) => {
		const { pubId } = req.params;
		const pub = await findPub(pubId);
		if (!pub) {
			throw new NotFoundError();
		}
		const resource = await transformPubToResource(
			// @ts-expect-error
			pub.get({ plain: true }),
			pub.community,
		);
		return res.status(200).json(resource);
	}),
);

app.post(
	'/api/pub/:pubId/doi',
	wrap(async (req, res) => {
		const { pubId } = req.params;
		const pubFields = await getUpdatablePubFields({ userId: req.user.id, pubId });
		try {
			assert(expect(pubFields).includes('doi'));
		} catch {
			throw new ForbiddenError();
		}
		const pub = await findPub(pubId);
		if (!pub) {
			return new NotFoundError();
		}
		const pubDoi =
			pub.doi ??
			(
				await generateDoi(
					{ communityId: pub.communityId, pubId, collectionId: undefined },
					'pub',
				)
			).pub;
		const resource = await transformPubToResource(
			// @ts-expect-error
			pub.get({ plain: true }),
			pub.community,
		);
		try {
			assertValidResource(resource);
		} catch (error) {
			return res.status(400).json({ error: (error as Error).message });
		}
		try {
			const { resourceAst } = await submitResource(pub, resource, expect(pubDoi), {
				pubId,
			});
			return res.status(200).json(resourceAst);
		} catch (error) {
			return res.status(400).json({ error: (error as Error).message });
		}
	}),
);

app.post(
	'/api/pub/:pubId/doi/preview',
	wrap(async (req, res) => {
		const { pubId } = req.params;
		const pubFields = await getUpdatablePubFields({ userId: req.user.id, pubId });
		try {
			assert(expect(pubFields).includes('doi'));
		} catch {
			throw new ForbiddenError();
		}
		const pub = await findPub(pubId);
		const pubDoi =
			pub.doi ??
			(
				await generateDoi(
					{ communityId: pub.communityId, pubId, collectionId: undefined },
					'pub',
				)
			).pub;
		const resource = await transformPubToResource(
			// @ts-expect-error
			pub.get({ plain: true }),
			pub.community,
		);
		try {
			assertValidResource(resource);
		} catch (error) {
			return res.status(400).json({ error: (error as Error).message });
		}
		try {
			const { resourceAst } = await prepareResource(pub, resource, expect(pubDoi));
			return res.status(200).json(resourceAst);
		} catch (error) {
			return res.status(400).json({ error: (error as Error).message });
		}
	}),
);
