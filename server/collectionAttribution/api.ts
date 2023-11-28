import { ForbiddenError } from 'server/utils/errors';

import { createGetRequestIds } from 'utils/getRequestIds';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { initServer } from '@ts-rest/express';
import { contract } from 'utils/api/contract';
import { queryOne } from 'utils/query/queryOne';
import { queryMany } from 'utils/query/queryMany';
import { expect } from 'utils/assert';
import {
	createCollectionAttribution,
	updateCollectionAttribution,
	destroyCollectionAttribution,
	getCollectionAttributions,
} from './queries';
import { getPermissions } from './permissions';
import { CollectionAttribution } from './model';
import { Collection } from '../collection/model';

extendZodWithOpenApi(z);

const getRequestIds = createGetRequestIds<{
	communityId?: string;
	collectionId?: string;
	id?: string;
}>();

/* Note: we typically use values like collectionAttributionId on API requests */
/* here, id is sent up, so there is a little bit of kludge to make */
/* the other interfaces consistent. I didn't fully understand AttributionEditor */
/* so I didn't make the downstream change, which would be the right solution. */

const s = initServer();

const collectionAttributionCustomScope = [
	{
		model: Collection,
		as: 'collection',
		foreignKey: 'collectionId',
	},
];

export const collectionAttributionServer = s.router(contract.collectionAttribution, {
	get: queryOne(CollectionAttribution, {
		customScope: collectionAttributionCustomScope,
	}),
	getMany: queryMany(CollectionAttribution, {
		customScope: collectionAttributionCustomScope,
	}),

	batchCreate: async ({ req, body }) => {
		const { attributions } = body;
		const requestIds = getRequestIds(body, req.user);
		const permissions = await getPermissions(requestIds);

		if (!permissions.create) {
			throw new ForbiddenError();
		}

		const existingAttributions = await getCollectionAttributions(requestIds.collectionId);
		const orderingBase = expect(
			existingAttributions.length ? existingAttributions.concat().pop()?.order : 1,
		);

		const newAttributions = await Promise.all(
			attributions
				.filter(
					(attr) =>
						!existingAttributions.some(
							(existingAttr) => existingAttr.userId === attr.userId,
						),
				)
				.map((attr, index, { length }) =>
					createCollectionAttribution({
						collectionId: requestIds.collectionId,
						...attr,
						order: orderingBase / 2 ** (length - index),
					}),
				),
		);

		return {
			status: 201,
			body: [...existingAttributions, ...newAttributions].sort((a, b) => a.order - b.order),
		};
	},

	create: async ({ req, body }) => {
		const permissions = await getPermissions(getRequestIds(body, req.user));
		if (!permissions.create) {
			throw new ForbiddenError();
		}
		const newAttribution = await createCollectionAttribution({
			...body,
			//			collectionAttributionId: body.id,
		});
		return { status: 201, body: newAttribution };
	},

	update: async ({ req, body }) => {
		const permissions = await getPermissions(getRequestIds(body, req.user));
		if (!permissions.update) {
			throw new ForbiddenError();
		}
		const updatedValues = await updateCollectionAttribution(
			{
				...body,
				collectionAttributionId: body.id,
			},
			permissions.update,
		);
		return { status: 200, body: updatedValues };
	},

	remove: async ({ req, body }) => {
		const permissions = await getPermissions(getRequestIds(body, req.user));
		if (!permissions.destroy) {
			throw new ForbiddenError();
		}
		await destroyCollectionAttribution({
			...body,
			collectionAttributionId: body.id,
		});
		return { status: 200, body: body.id };
	},
});
