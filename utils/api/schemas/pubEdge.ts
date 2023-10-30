import { z } from 'zod';
import * as types from 'types';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';

export const relationTypes = [
	'comment',
	'commentary',
	'preprint',
	'rejoinder',
	'reply',
	'review',
	'supplement',
	'translation',
	'version',
] as const;

extendZodWithOpenApi(z);

export const pubEdgeSchema = z.object({
	id: z.string().uuid(),
	pubId: z.string().uuid(),
	externalPublicationId: z.string().uuid().nullable(),
	targetPubId: z.string().uuid().nullable(),
	relationType: z.enum(relationTypes),
	rank: z.string(),
	pubIsParent: z.boolean(),
	approvedByTarget: z.boolean(),
}) satisfies z.ZodType<types.PubEdge>;

export const externalPublicationSchema = z.object({
	id: z.string().uuid(),
	title: z.string(),
	url: z.string().url(),
	contributors: z.array(z.string()).nullable(),
	doi: z.string().nullable(),
	description: z.string().nullable(),
	avatar: z.string().nullable(),
	publicationDate: z.string().nullable(),
});

export const externalPublicationCreateSchema = externalPublicationSchema
	.omit({ id: true })
	.partial({
		contributors: true,
		doi: true,
		description: true,
		avatar: true,
		publicationDate: true,
	});

export const pubEdgeCreateSchema = pubEdgeSchema
	.omit({ id: true, externalPublicationId: true, targetPubId: true })
	.partial({
		rank: true,
		approvedByTarget: true,
	})
	.and(
		z.union([
			z.object({
				targetPubId: z.string().uuid(),
				externalPublication: z.undefined().nullish(),
			}),
			z.object({
				targetPubId: z.undefined().nullish(),
				externalPublication: externalPublicationCreateSchema,
			}),
		]),
	);

export const pubEdgeUpdateSchema = pubEdgeSchema
	.omit({ id: true, externalPublicationId: true, targetPubId: true })
	.partial({
		pubId: true,
		rank: true,
		approvedByTarget: true,
		pubIsParent: true,
		relationType: true,
	})
	.extend({
		pubEdgeId: pubEdgeSchema.shape.id,
	})
	.and(
		z.union([
			z.object({
				targetPubId: z.string().uuid(),
				externalPublication: z.undefined().optional(),
			}),
			z.object({
				targetPubId: z.undefined().optional(),
				externalPublication: externalPublicationCreateSchema.partial(),
			}),
			z.object({
				targetPubId: z.undefined().optional(),
				externalPublication: z.undefined().optional(),
			}),
		]),
	);
