import { Pub } from 'server/models';

import * as types from 'types';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { pubAttributionSchema } from './pubAttribution';
import { discussionSchema } from './discussion';
import { collectionPubSchema } from './collectionPub';
import { collectionSchema } from './collection';
import { collectionAttributionSchema } from './collectionAttribution';
import { releaseSchema } from './release';

extendZodWithOpenApi(z);

export const pubSchema = z.object({
	id: z.string().uuid(),
	slug: z
		.string({
			description: 'Slug',
		})
		.regex(/^[a-zA-Z0-9-]+$/)
		.min(1)
		.max(280)
		.openapi({
			uniqueItems: true,
			example: 'some-slug',
		}),
	title: z.string().openapi({
		example: 'A beautiful title',
	}),
	htmlTitle: z.string().nullable().openapi({
		example: 'A <strong>beautiful</strong> <em>title</em>',
		description:
			'HTML version of the title, allows for things like <strong>bold</strong> and <em>italics</em>',
	}),
	description: z.string().max(280).min(0).nullable(),
	htmlDescription: z.string().max(280).min(0).nullable(),
	avatar: z.string({}).nullable().openapi({
		description: 'The preview image of a Pub',
	}),
	doi: z.string().nullable().openapi({
		example: '10.1101/2020.05.01.072975',
		description: 'The DOI of the pub',
	}),
	downloads: z
		.array(
			z.object({
				url: z.string().url(),
				type: z.literal('formatted'),
				createdAt: z
					.string()
					.datetime()
					.default(() => new Date().toISOString()),
			}),
		)
		.nullable(),
	customPublishedAt: z.coerce
		.date()
		.transform((d) => d.toString())
		.nullable() as z.ZodType<string | null>,
	labels: z
		.array(
			z.object({
				id: z.string().uuid(),
				color: z.string(),
				title: z.string(),
				publicApply: z.boolean(),
			}),
		)
		.nullable(),
	viewHash: z.string().nullable(),
	reviewHash: z.string().nullable(),
	editHash: z.string().nullable(),
	commentHash: z.string().nullable(),
	communityId: z.string().uuid(),
	metadata: z
		.object({
			mtg_id: z.string().openapi({ example: 'aas241' }),
			bibcode: z.string().openapi({ example: '2023AAS…24130111A' }),
			mtg_presentation_id: z.string().openapi({ example: '301.11' }),
		})
		.nullable(),
	draftId: z.string().uuid(),
	scopeSummaryId: z.string().uuid().nullable(),
	crossrefDepositRecordId: z.string().uuid().nullable(),
}) satisfies z.ZodType<types.Pub>;

export const pubPostSchema = z
	.object({
		communityId: z.string(),
	})
	.and(
		z.union([
			z.object({
				collectionId: z.string().nullish(),
				createPubToken: z.undefined(),
			}),
			z.object({
				createPubToken: z.string().nullish(),
				collectionId: z.undefined(),
			}),
			z.object({
				createPubToken: z.undefined(),
				collectionId: z.undefined(),
			}),
		]),
	) satisfies z.ZodType<types.CanCreatePub>;

export const getManyQuerySchema = z.object({
	query: z
		.object({
			excludeCollectionIds: z.array(z.string().uuid()).optional(),
			ordering: z
				.object({
					field: z.enum(['updatedDate', 'creationDate', 'collectionRank', 'title']),
					direction: z.enum(['ASC', 'DESC']),
				})
				.default({
					field: 'creationDate',
					direction: 'DESC',
				}),
			limit: z.number().optional().default(50),
			offset: z.number().optional().default(0),
		})
		.and(
			z.union([
				z.object({
					collectionIds: z.array(z.string().uuid()),
					pubIds: z.undefined().optional(),
				}),
				z.object({
					pubIds: z.array(z.string().uuid()),
					collectionIds: z.undefined().optional(),
				}),
				z.object({
					pubIds: z.undefined().optional(),
					collectionIds: z.undefined().optional(),
				}),
			]),
		) satisfies z.ZodType<types.GetManyQuery>,
	alreadyFetchedPubIds: z.array(z.string()),
	pubOptions: z.object({
		isAuth: z.boolean().optional(),
		isPreview: z.boolean().optional(),
		getCollections: z.boolean().optional(),
		getMembers: z.boolean().optional(),
		getCommunity: z.boolean().optional(),
		getExports: z.boolean().optional(),
		getEdges: z.enum(['all', 'approved-only']).optional(),
		getDraft: z.boolean().optional(),
		getDiscussions: z.boolean().optional(),
		getReviews: z.boolean().optional(),
		getEdgesOptions: z
			.object({
				includeCommunityForPubs: z.boolean().optional(),
				includeTargetPub: z.boolean().optional(),
				includePub: z.boolean().optional(),
			})
			.optional(),
		getSubmissions: z.boolean().optional(),
		getFacets: z.boolean().optional(),
	}) satisfies z.ZodType<types.PubGetOptions>,
}) satisfies z.ZodType<types.ManyRequestParams>;

export const sanitizedPubSchema = pubSchema.merge(
	z.object({
		attributions: pubAttributionSchema.array(),
		discussions: z.array(discussionSchema),
		collectionPubs: z.array(
			collectionPubSchema.merge(
				z.object({
					collection: collectionSchema.merge(
						z.object({
							attributions: z.array(collectionAttributionSchema),
						}),
					),
				}),
			),
		),
		isRelease: z.boolean(),
		releases: z.array(releaseSchema),
		releaseNumber: z.number().nullable(),
	}),
) satisfies z.ZodType<types.SanitizedPubData, any, any>;

export type PubPut = types.UpdateParams<Pub> & { pubId: string };

export const pubPutSchema = pubSchema
	.partial()
	.omit({
		communityId: true,
		draftId: true,
		scopeSummaryId: true,
		crossrefDepositRecordId: true,
	})
	.merge(
		z.object({
			pubId: z.string(),
		}),
	) satisfies z.ZodType<PubPut>;

export const resourceASTSchema = z.object({
	type: z.literal('element'),
	name: z.string(),
	attributes: z.record(z.string()).optional(),
	children: z.array(z.any()).optional(),
});
