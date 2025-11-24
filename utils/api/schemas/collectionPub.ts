import type * as types from 'types';

import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';

import { baseSchema } from '../utils/baseSchema';

extendZodWithOpenApi(z);
export const collectionPubSchema = baseSchema.extend({
	pubId: z.string().uuid(),
	collectionId: z.string().uuid(),
	contextHint: z.string().nullable(),
	rank: z.string(),
	pubRank: z.string(),
}) satisfies z.ZodType<types.CollectionPub>;

export const updateCollectionPubSchema = collectionPubSchema
	.omit({ id: true, updatedAt: true, createdAt: true })
	.partial()
	.merge(collectionPubSchema.pick({ id: true }));

export const createCollectionPubSchema = collectionPubSchema
	.pick({
		pubId: true,
		collectionId: true,
	})
	.merge(
		collectionPubSchema
			.pick({
				rank: true,
				moveToTop: true,
			})
			.partial(),
	)
	.merge(
		z.object({
			communityId: z.string().uuid(),
			moveToTop: z.boolean().optional(),
		}),
	);
