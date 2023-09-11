import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import {
	createCollectionPubSchema,
	collectionPubSchema,
	updateCollectionPubSchema,
} from '../schemas/collectionPub';
import { pubSchema } from '../schemas/pub';

extendZodWithOpenApi(z);

const c = initContract();

export const collectionPubContract = c.router({
	get: {
		path: '/api/collectionPubs',
		method: 'GET',
		summary: 'Get the pubs associated with a collection',
		description: 'Get the pubs associated with a collection',
		query: z.object({
			pubId: z.string().uuid().optional(),
			collectionId: z.string().uuid(),
			communityId: z.string().uuid(),
		}),
		responses: {
			200: z.array(pubSchema),
		},
	},
	create: {
		path: '/api/collectionPubs',
		method: 'POST',
		summary: 'Add a pub to a collection',
		description: 'Add a pub to a collection',
		body: createCollectionPubSchema,
		responses: {
			201: collectionPubSchema,
		},
	},
	update: {
		path: '/api/collectionPubs',
		method: 'PUT',
		summary: 'Update pubs for collection',
		description: 'Change the pubs that are associated with a collection',
		body: updateCollectionPubSchema.merge(
			z.object({
				communityId: z.string().uuid(),
			}),
		),
		responses: {
			200: updateCollectionPubSchema.omit({ id: true }),
		},
	},
	remove: {
		path: '/api/collectionPubs',
		method: 'DELETE',
		summary: 'Remove a pub from a collection',
		description: 'Remove a pub from a collection',
		body: z.object({
			id: z.string().uuid(),
			communityId: z.string().uuid(),
		}),
		responses: {
			200: z.string().uuid(),
		},
	},
});
