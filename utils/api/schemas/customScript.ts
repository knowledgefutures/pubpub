import { z } from 'zod';
import * as types from 'types';

export const customScriptSchema = z.object({
	id: z.string().uuid(),
	communityId: z.string().nullable(),
	type: z.string().nullable(),
	content: z.string().nullable(),
}) satisfies z.ZodType<types.CustomScript>;

export const createCustomScriptSchema = customScriptSchema.omit({ id: true });
