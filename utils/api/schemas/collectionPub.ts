import * as types from 'types';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';

extendZodWithOpenApi(z);
export const collectionPubSchema = z.object({
	id: z.string().uuid(),
	pubId: z.string().uuid(),
	collectionId: z.string().uuid(),
	contextHint: z.string().nullable(),
	rank: z.string(),
	pubRank: z.string(),
}) satisfies z.ZodType<types.CollectionPub>;

export const updateCollectionPubSchema = collectionPubSchema
	.omit({ id: true })
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
