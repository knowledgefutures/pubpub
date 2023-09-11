import { z } from 'zod';

export type DocJson = { type: 'doc'; attrs: any; content: any[] };

export const docJsonSchema = z.object({
	type: z.literal('doc'),
	attrs: z.any(),
	content: z.array(z.any()),
}) as z.ZodType<DocJson>;
