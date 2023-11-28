import { z } from 'zod';

export const draftSchema = z.object({
	id: z.string().uuid(),
	latestKeyAt: z.coerce
		.date()
		.transform((d) => d.toString())
		.nullable() as z.ZodType<string | null>,
	firebasePath: z.string(),
});
