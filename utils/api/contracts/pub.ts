import { initContract } from '@ts-rest/core';
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
	pubPutSchema,
	pubSchema,
	pubWithRelationsSchema,
	resourceASTSchema,
	sanitizedPubSchema,
	toPubImportOutput,
} from '../schemas/pub';
import { docJsonSchema } from '../schemas/release';
import { sourceFileSchema } from '../schemas/import';

extendZodWithOpenApi(z);

const c = initContract();

export const pubContract = c.router({
	get: {
		path: '/api/pubs/:slugOrId',
		method: 'GET',
		summary: "Get a pub by it's slug or id",
		description:
			"Get a pub by it's slug or id.\n\n The slug is the thing after `/pub/` in the URL, but before `/release` or `/draft`.",
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
	},
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
	},
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
	update: {
		path: '/api/pubs',
		method: 'PUT',
		summary: 'Update a Pub',
		description: 'Update a Pub',
		body: pubPutSchema,
		responses: {
			200: pubPutSchema.omit({
				pubId: true,
			}),
		},
	},
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
	text: {
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
		},
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
		},
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
		},
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
		},
		importToPub: {
			path: '/api/pubs/:pubId/text/import',
			method: 'POST',
			summary: 'Import a file to a pub',
			description: 'Upload files and import it to a pub.',
			pathParams: z.object({
				pubId: z.string().uuid(),
			}),
			body: baseWithPubId,
			responses: {
				200: toPubImportOutput,
			},
		},
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
		},
	},
});
