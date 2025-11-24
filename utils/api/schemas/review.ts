import { z } from 'zod';

import { docJsonSchema } from './release';

export const reviewNewSchema = z.object({
	id: z.string().uuid(),
	title: z.string().nullable(),
	number: z.number(),
	status: z.enum(['open', 'closed', 'completed']).default('open'),
	releaseRequested: z.boolean().nullable(),
	labels: z.unknown().nullable(),
	threadId: z.string().uuid(),
	visibilityId: z.string().uuid(),
	userId: z.string().uuid().nullable(),
	pubId: z.string().uuid().nullable(),
	reviewContent: docJsonSchema.nullable(),
	// For associations, we can't validate them using Zod at this level. They are usually validated in service or controller level.
});
