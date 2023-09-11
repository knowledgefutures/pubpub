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
