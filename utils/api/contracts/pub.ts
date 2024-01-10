import type { AppRouter } from '@ts-rest/core';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';

import { createGetManyQueryOptions } from 'utils/query/createGetManyQuery';
import { createGetQueryOptions } from 'utils/query/createGetQuery';

import { resourceSchema } from '../schemas/resource';
import {
	base,
	baseWithImport,
	baseWithPubId,
	fullImportOutput,
	getManyQuerySchema,
	importMethodSchema,
	optionalPubCreateParamSchema,
	pandocOutputSchema,
	pubCreateSchema,
	pubUpdateSchema,
	pubSchema,
	pubWithRelationsSchema,
	resourceASTSchema,
	sanitizedPubSchema,
	toPubImportOutput,
} from '../schemas/pub';
import { docJsonSchema } from '../schemas/release';
import { sourceFileSchema } from '../schemas/import';
import { Metadata } from '../utils/metadataType';

extendZodWithOpenApi(z);

const textRouter = {
	/**
	 * `GET /api/pubs/:pubId/text`
	 *
	 * Get the text of a Pub as a ProseMirror document
	 *
	 * @access You need to be an **admin** of this community in order to access this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-pubs-pubId-text/get}
	 */
	get: {
		path: '/api/pubs/:pubId/text',
		method: 'GET',
		summary: 'Get the text of a Pub',
		description: 'Get the text of a Pub as a ProseMirror document',
		pathParams: z.object({
			pubId: z.string().uuid(),
		}),
		responses: {
			200: docJsonSchema,
		},
		metadata: {
			loggedIn: 'admin',
		} satisfies Metadata,
	},
	/**
	 * `PUT /api/pubs/:pubId/text`
	 *
	 * Replace the text of a pub with a different ProseMirror document
	 *
	 * @access You need to be an **admin** of this community in order to access this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-pubs-pubId-text/put}
	 */
	update: {
		path: '/api/pubs/:pubId/text',
		method: 'PUT',
		summary: 'Replace the text of a pub',
		description: 'Replace the text of a pub with a different ProseMirror document',
		pathParams: z.object({
			pubId: z.string().uuid(),
		}),
		body: z.object({
			doc: docJsonSchema,
			clientID: z.string().default('api'),
			publishRelease: z.boolean().default(false),
			method: importMethodSchema,
		}),
		responses: {
			200: z.object({
				doc: docJsonSchema,
				url: z.string().url().optional(),
			}),
			400: z.object({ error: z.string() }),
		},
		metadata: {
			loggedIn: 'admin',
		} satisfies Metadata,
	},
	/**
	 * `POST /api/pubs/text/importOld`
	 *
	 * Create a pub and upload a file and import it to a pub.
	 *
	 * @access You need to be an **admin** of this community in order to access this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-pubs-text-importOld/post}
	 */
	importOld: {
		path: '/api/pubs/text/importOld',
		method: 'POST',
		summary: 'Create a pub and import files to it',
		description: 'Create a pub and upload a file and import it to a pub.',
		body: z.object({
			pub: optionalPubCreateParamSchema
				.extend({ collectionId: z.string().uuid().optional() })
				.partial()
				.optional(),
			sourceFiles: z.array(sourceFileSchema),
		}),
		responses: {
			201: z.object({ doc: docJsonSchema, pub: pubSchema }),
		},
		metadata: {
			loggedIn: 'admin',
		} satisfies Metadata,
	},
	/**
	 * `POST /api/pubs/text/import`
	 *
	 * Create a pub and upload a file and import it to a pub.
	 *
	 * @access You need to be an **admin** of this community in order to access this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-pubs-text-import/post}
	 */
	import: {
		path: '/api/pubs/text/import',
		method: 'POST',
		summary: 'Create a pub and import files to it',
		description: 'Create a pub and upload a file and import it to a pub.',
		contentType: 'multipart/form-data',
		body: baseWithImport,
		responses: {
			201: fullImportOutput,
		},
		metadata: {
			loggedIn: 'admin',
		} satisfies Metadata,
	},
	/**
	 * `POST /api/pubs/:pubId/text/import`
	 *
	 * Upload files and import it to a pub.
	 *
	 * @access You need to be an **admin** of this community in order to access this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-pubs-pubId-text-import/post}
	 */
	importToPub: {
		path: '/api/pubs/:pubId/text/import',
		method: 'POST',
		summary: 'Import a file to a pub',
		description: 'Upload files and import it to a pub.',
		contentType: 'multipart/form-data',
		pathParams: z.object({
			pubId: z.string().uuid(),
		}),
		body: baseWithPubId,
		responses: {
			200: toPubImportOutput,
		},
		metadata: {
			loggedIn: 'admin',
		} satisfies Metadata,
	},
	/**
	 * `POST /api/pubs/text/convert`
	 *
	 * Convert files to a ProseMirror document.
	 *
	 * Mostly for use in conjunction with `PUT /api/pubs/:pubId/text`.
	 *
	 * @access You need to be an **admin** of this community in order to access this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-pubs-text-convert/post}
	 */
	convert: {
		path: '/api/pubs/text/convert',
		method: 'POST',
		summary: 'Convert files to a ProseMirror document',
		description:
			'Convert files to a ProseMirror document.\n\n Mostly for use in conjunction with `PUT /api/pubs/:pubId/text`.',
		contentType: 'multipart/form-data',
		body: base,
		responses: {
			200: pandocOutputSchema,
		},
		metadata: {
			loggedIn: 'admin',
		} satisfies Metadata,
	},
} as const satisfies AppRouter;

type TextRouterType = typeof textRouter;
export interface TextRouter extends TextRouterType {}

export const pubRouter = {
	/**
	 * `GET /api/pubs/:slugOrId`
	 *
	 * Get a pub by it's slug or id.
	 *
	 * The slug is the thing after `/pub/` in the URL, but before `/release` or `/draft`.
	 *
	 * @access You need to be an **admin** of this community in order to access this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-pubs-slugOrId/get}
	 */
	get: {
		path: '/api/pubs/:slugOrId',
		method: 'GET',
		summary: "Get a pub by it's slug or id",
		description: `
		Get a pub by it's slug or id.

		The slug is the thing after \`/pub/\` in the URL, but before \`/release\` or \`/draft\`.`,
		pathParams: z.object({
			slugOrId: z.string().openapi({
				description:
					'The id is a UUID, the slug is a string. The slug is `/pub/<slug>/` <- this part',
			}),
		}),
		query: createGetQueryOptions(pubWithRelationsSchema, {
			include: {
				options: [
					'attributions',
					'collectionPubs',
					'community',
					'draft',
					'members',
					'releases',
					'reviews',
					'submission',
					'inboundEdges',
					'outboundEdges',
				],
				defaults: ['attributions', 'draft'],
			},
		}),
		responses: {
			200: pubWithRelationsSchema,
		},
		metadata: {
			loggedIn: 'admin',
		} satisfies Metadata,
	},
	/**
	 * `GET /api/pubs`
	 *
	 * Get many pubs
	 *
	 * @access You need to be an **admin** of this community in order to access this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-pubs/get}
	 */
	getMany: {
		path: '/api/pubs',
		method: 'GET',
		summary: 'Get many pubs',
		description: 'Get many pubs',
		query: createGetManyQueryOptions(pubWithRelationsSchema, {
			sort: {
				options: ['title', 'slug'],
			},
			include: {
				options: [
					'attributions',
					'collectionPubs',
					'community',
					'draft',
					'members',
					'releases',
					'reviews',
					'submission',
					'inboundEdges',
					'outboundEdges',
				],
				defaults: ['attributions', 'draft'],
			},
		}),
		responses: {
			200: z.array(pubWithRelationsSchema),
		},
		metadata: {
			loggedIn: 'admin',
		} satisfies Metadata,
	},
	/**
	 * `POST /api/pubs`
	 *
	 * Create a Pub
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-pubs/post}
	 */
	create: {
		path: '/api/pubs',
		method: 'POST',
		summary: 'Create a Pub',
		description: 'Create a Pub',
		body: pubCreateSchema,
		responses: {
			201: pubSchema,
		},
	},
	/**
	 * `PUT /api/pubs`
	 *
	 * Update a Pub
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-pubs/put}
	 */
	update: {
		path: '/api/pubs',
		method: 'PUT',
		summary: 'Update a Pub',
		description: 'Update a Pub',
		body: pubUpdateSchema,
		responses: {
			200: pubUpdateSchema.omit({
				pubId: true,
			}),
		},
	},
	/**
	 * `DELETE /api/pubs`
	 *
	 * Remove a Pub
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-pubs/delete}
	 */
	remove: {
		path: '/api/pubs',
		method: 'DELETE',
		summary: 'Remove a Pub',
		description: 'Remove a Pub',
		body: z.object({
			pubId: z.string().uuid(),
		}),
		responses: {
			200: z.object({}),
		},
	},
	/**
	 * `POST /api/pubs/many`
	 *
	 * Search for many pubs. This is an older alternative to the more standardised `GET /api/pubs`,
	 * offering different options.
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-pubs-many/post}
	 */
	queryMany: {
		path: '/api/pubs/many',
		method: 'POST',
		summary: 'Search for Pubs',
		description:
			'Search for many pubs. This is an older alternative to the more standardised `GET /api/pubs`, offering different options.',
		body: getManyQuerySchema,
		responses: {
			200: z.object({
				pubIds: z.array(z.string().uuid()),
				pubsById: z.record(sanitizedPubSchema),
				loadedAllPubs: z.boolean().or(z.number()).optional().nullable(),
			}),
		},
	},
	doi: {
		/**
		 * `POST /api/pubs/:pubId/doi`
		 *
		 * Deposit metadata to create a DOI
		 *
		 * @access You need to be **logged in** and have access to this resource.
		 *
		 * @routeDocumentation
		 * {@link https://pubpub.org/apiDocs#/paths/api-pubs-pubId-doi/post}
		 */
		deposit: {
			path: '/api/pubs/:pubId/doi',
			method: 'POST',
			summary: 'Create a DOI',
			description: 'Deposit metadata to create a DOI',
			pathParams: z.object({
				pubId: z.string().uuid(),
			}),
			body: z.null().or(z.object({})).optional(),
			responses: {
				200: resourceASTSchema,
				400: z.object({ error: z.string() }),
			},
		},
		/**
		 * `POST /api/pubs/:pubId/doi/preview`
		 *
		 * Preview a DOI deposit
		 *
		 * @access You need to be **logged in** and have access to this resource.
		 *
		 * @routeDocumentation
		 * {@link https://pubpub.org/apiDocs#/paths/api-pubs-pubId-doi-preview/post}
		 */
		preview: {
			path: '/api/pubs/:pubId/doi/preview',
			method: 'POST',
			summary: 'Preview a DOI deposit',
			description: 'Preview a DOI deposit',
			pathParams: z.object({
				pubId: z.string().uuid(),
			}),
			body: z.null().or(z.object({})).optional(),
			responses: {
				200: resourceASTSchema,
				400: z.object({ error: z.string() }),
			},
		},
	},
	/**
	 * `GET /api/pubs/:pubId/resource`
	 *
	 * Get pub as a resource
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-pubs-pubId-resource/get}
	 */
	getResource: {
		path: '/api/pubs/:pubId/resource',
		method: 'GET',
		summary: 'Get pub as a resource',
		description: 'Get pub as a resource',
		pathParams: z.object({
			pubId: z.string().uuid(),
		}),
		responses: {
			200: resourceSchema,
		},
	},
	/** Methods for working with the text of a pub */
	text: textRouter as TextRouter,
} as const satisfies AppRouter;

type PubRouterType = typeof pubRouter;

export interface PubRouter extends PubRouterType {}
