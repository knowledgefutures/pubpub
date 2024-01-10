import type { AppRouter } from '@ts-rest/core';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { facetSchema } from '../schemas/facets';

extendZodWithOpenApi(z);

export const facetsRouter = {
	/**
	 * `POST /api/facets`
	 *
	 * Facets are properties that cascade down from a community, collection, or publication to all
	 * of its children, like the style of citation used or the license for content.
	 *
	 * You cannot "unset" facets, so passing an empty object will just be treated as no change.
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-facets/post}
	 */
	update: {
		path: '/api/facets',
		method: 'POST',
		summary: 'Update facets for a scope',
		description:
			'Facets are properties that cascade down from a community, collection, or publication to all of its children, like the style of citation used or the license for content.\n\nYou cannot "unset" facets, so passing an empty object will just be treated as no change.',
		body: facetSchema,
		responses: {
			200: z.object({}),
		},
	},
} as const satisfies AppRouter;

type FacetsRouterType = typeof facetsRouter;

export interface FacetsRouter extends FacetsRouterType {}
