import { prepareResource, submitResource } from 'deposit/datacite/deposit';
import { generateDoi } from 'server/doi/queries';
import app, { wrap } from 'server/server';
import { ForbiddenError, NotFoundError } from 'server/utils/errors';
import { expect } from 'utils/assert';

import { transformCollectionToResource } from 'deposit/transform/collection';
import { getPermissions } from './permissions';
import { createCollection, destroyCollection, findCollection, updateCollection } from './queries';

const getRequestIds = (req) => {
	const user = req.user || {};
	return {
		userId: user.id,
		communityId: req.body.communityId,
		collectionId: req.body.id || null,
	};
};

app.post(
	'/api/collections',
	wrap(async (req, res) => {
		const requestIds = getRequestIds(req);
		const permissions = await getPermissions(requestIds);
		if (!permissions.create) {
			throw new ForbiddenError();
		}
		const newCollection = await createCollection(req.body, req.user.id);
		return res.status(201).json(newCollection);
	}),
);

app.put(
	'/api/collections',
	wrap(async (req, res) => {
		const permissions = await getPermissions(getRequestIds(req));
		if (!permissions.update) {
			throw new ForbiddenError();
		}
		const updatedValues = await updateCollection(
			{
				...req.body,
				collectionId: req.body.id,
			},
			permissions.update,
			req.user.id,
		);
		return res.status(200).json(updatedValues);
	}),
);

app.delete(
	'/api/collections',
	wrap(async (req, res) => {
		const permissions = await getPermissions(getRequestIds(req));
		if (!permissions.update) {
			throw new ForbiddenError();
		}
		await destroyCollection(
			{
				...req.body,
				collectionId: req.body.id,
			},
			req.user.id,
		);
		return res.status(200).json(req.body.id);
	}),
);

app.get(
	'/api/collection/:collectionId/resource',
	wrap(async (req, res) => {
		const { collectionId } = req.params;
		const collection = await findCollection(collectionId);
		if (!collection) {
			return new NotFoundError();
		}
		const resource = await transformCollectionToResource(
			collection.toJSON(),
			collection.community,
		);
		return res.status(200).json(resource);
	}),
);

app.post(
	'/api/collection/:collectionId/doi',
	wrap(async (req, res) => {
		const { collectionId } = req.params;
		const collection = await findCollection(collectionId);
		if (!collection) {
			return new NotFoundError();
		}
		const permissions = await getPermissions({
			userId: req.user.id,
			collectionId,
			communityId: collection.communityId,
		});
		if (!permissions.update) {
			throw new ForbiddenError();
		}
		const collectionDoi =
			collection.doi ??
			(
				await generateDoi(
					{ communityId: collection.communityId, collectionId, pubId: undefined },
					'collection',
				)
			).collection;
		const resource = await transformCollectionToResource(
			collection.toJSON(),
			collection.community,
		);
		try {
			const { resourceAst } = await submitResource(
				collection,
				resource,
				expect(collectionDoi),
				{ collectionId },
			);
			return res.status(200).json(resourceAst);
		} catch (error) {
			return res.status(400).json({ error: (error as Error).message });
		}
	}),
);

app.post(
	'/api/collection/:collectionId/doi/preview',
	wrap(async (req, res) => {
		const { collectionId } = req.params;
		const collection = await findCollection(collectionId);
		const permissions = await getPermissions({
			userId: req.user.id,
			collectionId,
			communityId: collection.communityId,
		});
		if (!permissions.update) {
			throw new ForbiddenError();
		}
		const collectionDoi =
			collection.doi ??
			(
				await generateDoi(
					{ communityId: collection.communityId, collectionId, pubId: undefined },
					'collection',
				)
			).collection;
		const resource = await transformCollectionToResource(
			collection.toJSON(),
			collection.community,
		);
		try {
			const { resourceAst } = await prepareResource(
				collection,
				resource,
				expect(collectionDoi),
			);
			return res.status(200).json(resourceAst);
		} catch (error) {
			return res.status(400).json({ error: (error as Error).message });
		}
	}),
);
