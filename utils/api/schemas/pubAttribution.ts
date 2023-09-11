import * as types from 'types';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { PubAttribution } from 'server/models';
import {
	attributionSchema,
	attributionCreationSchema,
	updateAttributionSchema,
} from './attribution';

extendZodWithOpenApi(z);

export const pubAttributionSchema = attributionSchema.merge(
	z.object({
		pubId: z.string().uuid(),
	}),
);

export const batchPubAttributionCreationSchema = z.object({
	attributions: z.array(attributionCreationSchema),
	communityId: z.string(),
	pubId: z.string(),
});

export const pubAttributionCreationSchema = z
	.object({
		communityId: z.string(),
		pubId: z.string(),
	})
	.and(attributionCreationSchema);

export const pubAttributionUpdateSchema = updateAttributionSchema.merge(
	z.object({ pubId: z.string().uuid(), communityId: z.string().uuid() }),
) satisfies z.ZodType<types.UpdateParams<PubAttribution>>;

export const pubAttributionRemoveSchema = z.object({
	id: z.string().uuid().openapi({ description: 'The attribution id' }),
	communityId: z.string().uuid(),
	pubId: z.string().uuid(),
});
