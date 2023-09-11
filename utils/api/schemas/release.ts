import * as types from 'types';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';

extendZodWithOpenApi(z);

export const releaseSchema = z.object({
	id: z.string().uuid(),
	noteContent: types.docJsonSchema.nullable(),
	noteText: z.string().nullable(),
	pubId: z.string().uuid(),
	userId: z.string().uuid(),
	docId: z.string().uuid(),
	historyKey: z.number().int().min(-1),
	historyKeyMissing: z.boolean(),
}) satisfies z.ZodType<types.Release>;
