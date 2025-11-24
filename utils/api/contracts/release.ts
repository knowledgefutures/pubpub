import type { AppRouter } from '@ts-rest/core';

import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';

import { releaseSchema } from '../schemas/release';

extendZodWithOpenApi(z);

export const releaseRouter = {
	/**
	 * `POST /api/releases`
	 *
	 * Create a release
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-releases/post}
	 */
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
} as const satisfies AppRouter;

type ReleaseRouterType = typeof releaseRouter;

export interface ReleaseRouter extends ReleaseRouterType {}
