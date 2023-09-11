import * as types from 'types';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';

extendZodWithOpenApi(z);

export const discussionSchema = z.object({
	id: z.string().uuid(),
	title: z.string().nullable(),
	number: z.number().int(),
	isClosed: z.boolean().nullable(),
	labels: z.array(z.string()).nullable(),
	threadId: z.string().uuid(),
	visibilityId: z.string().uuid(),
	userId: z.string().uuid().nullable(),
	anchorId: z.string().uuid().nullable(),
	pubId: z.string().uuid().nullable(),
	commenterId: z.string().uuid().nullable(),
}) satisfies z.ZodType<types.Discussion>;
