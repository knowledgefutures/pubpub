import { ForbiddenError } from 'server/utils/errors';

import { createGetRequestIds } from 'utils/getRequestIds';
import { z } from 'zod';
import { attributionSchema } from 'server/pubAttribution/api';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { initServer } from '@ts-rest/express';
import { contract } from 'utils/api/contract';
import {
	createCollectionAttribution,
	updateCollectionAttribution,
	destroyCollectionAttribution,
} from './queries';
import { getPermissions } from './permissions';

extendZodWithOpenApi(z);

const getRequestIds = createGetRequestIds<{
	communityId?: string;
	collectionId?: string;
	id?: string;
}>();

export const collectionAttributionSchema = attributionSchema.merge(
	z.object({
		collectionId: z.string().uuid(),
	}),
);

/* Note: we typically use values like collectionAttributionId on API requests */
/* here, id is sent up, so there is a little bit of kludge to make */
/* the other interfaces consistent. I didn't fully understand AttributionEditor */
/* so I didn't make the downstream change, which would be the right solution. */

const s = initServer();

export const collectionAttributionServer = s.router(contract.collectionAttribution, {
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
