import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { releaseSchema } from '../schemas/release';

extendZodWithOpenApi(z);

const c = initContract();

export const releaseContract = c.router({
	create: {
		path: '/api/releases',
		method: 'POST',
		summary: 'Create a release',
		description: 'Create a release',
		body: z.object({
			pubId: releaseSchema.shape.pubId,
			historyKey: releaseSchema.shape.historyKey.optional().openapi({
				description: "You probably don't want to provide this manually",
			}),
			noteText: releaseSchema.shape.noteText.optional(),
			noteContent: releaseSchema.shape.noteContent.optional(),
		}),
		responses: {
			201: releaseSchema,
			400: z.string(),
		},
	},
});
