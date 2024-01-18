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

export const collectionPubQuerySchema = z.object({
	pubId: z.string().uuid().optional(),
	collectionId: z.string().uuid(),
	communityId: z.string().uuid(),
	limit: z.number().int().min(1).default(10),
	offset: z.number().int().min(0).default(0),
});

export type CollectionPubQueryInput = (typeof collectionPubQuerySchema)['_input'];
