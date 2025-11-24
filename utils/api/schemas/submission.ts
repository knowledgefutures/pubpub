import { z } from 'zod';

import { docJsonSchema } from './release';

export const submissionSchema = z.object({
	id: z.string().uuid(),
	status: z.enum(['received', 'incomplete', 'accepted', 'declined']),
	submittedAt: z.coerce
		.date()
		.transform((d) => d.toString())
		.nullable() as z.ZodType<string | null>,
	submissionWorkflowId: z.string().uuid(),
	pubId: z.string().uuid(),
	abstract: docJsonSchema.nullable(),
});
