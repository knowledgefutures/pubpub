import { ForbiddenError } from 'server/utils/errors';

import { expect } from 'utils/assert';
import { createGetRequestIds } from 'utils/getRequestIds';
import { contract } from 'utils/api/contract';
import { initServer } from '@ts-rest/express';
import { queryMany } from 'utils/query/queryMany';
import { queryOne } from 'utils/query/queryOne';
import { getPermissions } from './permissions';
import {
	createPubAttribution,
	updatePubAttribution,
	destroyPubAttribution,
	getPubAttributions,
} from './queries';
import { PubAttribution } from './model';
import { Pub } from '../pub/model';

const getRequestIds = createGetRequestIds<{
	communityId?: string;
	pubId?: string;
	id?: string;
}>();

const s = initServer();

const pubAttributionCustomScope = [
	{
		model: Pub,
		as: 'pub',
		foreignKey: 'pubId',
	},
];

export const pubAttributionServer = s.router(contract.pubAttribution, {
	get: queryOne(PubAttribution, {
		customScope: pubAttributionCustomScope,
	}),
	getMany: queryMany(PubAttribution, {
		customScope: pubAttributionCustomScope,
	}),

	batchCreate: async ({ req, body }) => {
		const { attributions } = body;
		const requestIds = getRequestIds(body, req.user);
		const permissions = await getPermissions(requestIds);

		if (!permissions.create) {
			throw new ForbiddenError();
		}

		const existingAttributions = await getPubAttributions(requestIds.pubId);
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
					createPubAttribution({
						pubId: requestIds.pubId,
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
		const requestIds = getRequestIds(body, req.user);
		const permissions = await getPermissions(requestIds);
		if (!permissions.create) {
			throw new ForbiddenError();
		}
		const newPubAttribution = await createPubAttribution({
			...body,
		});
		return { status: 201, body: newPubAttribution };
	},

	update: async ({ req, body }) => {
		const requestIds = getRequestIds(body, req.user);
		const permissions = await getPermissions(requestIds);
		if (!permissions.update) {
			throw new ForbiddenError();
		}

		const updatedValues = await updatePubAttribution(
			{
				...body,
				pubAttributionId: body.id,
			},
			permissions.update,
		);
		return { status: 200, body: updatedValues };
	},
	remove: async ({ req, body }) => {
		const requestIds = getRequestIds(body, req.user);
		const permissions = await getPermissions(requestIds);
		if (!permissions.destroy) {
			throw new ForbiddenError();
		}
		await destroyPubAttribution({
			...body,
			pubAttributionId: body.id,
		});
		return { status: 200, body: body.id };
	},
});
