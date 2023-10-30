import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import * as types from 'types';
import { generateHash } from 'utils/hashes';
import { docJsonSchema } from './release';

export const textAligns = ['left', 'center'] as const;

export const pubPreviewTypes = ['minimal', 'small', 'medium', 'large'] as const;
extendZodWithOpenApi(z);

export const layoutBlockBannerSchema = z
	.object({
		type: z.literal('banner'),
		id: z.string().default(generateHash(8)),
		content: z.object({
			align: z.enum(['left', 'center']).optional(),
			backgroundColor: z.string().optional(),
			backgroundHeight: z.enum(['tall', 'narrow']).optional(),
			backgroundImage: z.string().nullish(),
			backgroundSize: z.enum(['full', 'standard']).optional(),
			buttonText: z.string().optional(),
			buttonType: z.enum(['none', 'link', 'signup', 'create-pub']).optional(),
			buttonUrl: z.string().optional(),
			showButton: z.boolean().optional(),
			text: z.string().optional(),
		}),
	})
	.openapi({
		title: 'Banner block',
	}) satisfies z.ZodType<types.MaybeHas<types.LayoutBlockBanner, 'id'>>;

export const layoutBlockCollectionPagesSchema = z
	.object({
		type: z.literal('collections-pages'),
		id: z.string().default(generateHash(8)),
		content: z.object({
			items: z.array(
				z
					.object({
						type: z.enum(['collection', 'page']),
						id: z.string().uuid(),
					})
					.openapi({
						title: 'Collection or page',
					})
					.or(
						z
							.object({
								id: z.string().uuid(),
								createdAt: z.string(),
								isPublic: z.boolean(),
								title: z.string(),
							})
							.openapi({
								title: '<Interal do not use>',
							}),
					),
			),
			title: z.string().optional(),
			justify: z.enum(['left', 'center', 'space-between', 'space-around']).optional(),
		}),
	})
	.openapi({
		title: 'Collection/pages block',
	}) satisfies z.ZodType<types.MaybeHas<types.LayoutBlockCollectionsPages, 'id'>>;

export const layoutBlockHtmlSchema = z
	.object({
		type: z.literal('html'),
		id: z.string().default(generateHash(8)),
		content: z.object({
			html: z.string().optional(),
		}),
	})
	.openapi({
		title: 'HTML block',
	}) satisfies z.ZodType<types.MaybeHas<types.LayoutBlockHtml, 'id'>>;

export const pubSortOrders = [
	'creation-date',
	'creation-date-reversed',
	'publish-date',
	'publish-date-reversed',
	'collection-rank',
] as const;

export const layoutBlockPubsSchema = z
	.object({
		type: z.literal('pubs'),
		id: z.string().default(generateHash(8)),
		content: z.object({
			collectionIds: z.array(z.string()).optional(),
			hideByline: z.boolean().optional(),
			hideContributors: z.boolean().optional(),
			hideDates: z.boolean().optional(),
			hideDescription: z.boolean().optional(),
			hideEdges: z.boolean().optional(),
			limit: z.number().optional(),
			pubIds: z.array(z.string()).optional(),
			pubPreviewType: z.enum(pubPreviewTypes),
			sort: z.enum(pubSortOrders).optional(),
			title: z.string().optional(),
		}),
	})
	.openapi({
		title: 'Pubs block',
	}) satisfies z.ZodType<types.MaybeHas<types.LayoutBlockPubs, 'id'>>;

export const layoutBlockTextSchema = z
	.object({
		type: z.literal('text'),
		id: z.string().default(generateHash(8)),
		content: z.object({
			text: docJsonSchema.optional(),
			align: z.enum(textAligns).optional(),
		}),
	})
	.openapi({
		title: 'Text block',
	}) satisfies z.ZodType<types.MaybeHas<types.LayoutBlockText, 'id'>>;

export const layoutBlockCollectionHeaderSchema = z
	.object({
		type: z.literal('collection-header'),
		id: z.string().default(generateHash(8)),
		content: z.object({
			hideByline: z.boolean().optional(),
			hideContributors: z.boolean().optional(),
			hideDate: z.boolean().optional(),
			hideDoi: z.boolean().optional(),
			hideCollectionKey: z.boolean().optional(),
			hiddenMetadataFields: z.array(z.string()).optional(),
		}),
	})
	.openapi({
		title: 'Collection header block',
	}) satisfies z.ZodType<types.MaybeHas<types.LayoutBlockCollectionHeader, 'id'>>;

export const layoutBlockSubmissionBannerSchema = z
	.object({
		type: z.literal('submission-banner'),
		id: z.string().default(generateHash(8)),
		content: z.object({
			title: z.string(),
			body: docJsonSchema,
			submissionWorkflowId: z.string(),
		}),
	})
	.openapi({
		title: 'Submission banner block',
	}) satisfies z.ZodType<types.MaybeHas<types.LayoutBlockSubmissionBanner, 'id'>>;

export const layoutBlockSchema = z.discriminatedUnion('type', [
	layoutBlockBannerSchema,
	layoutBlockCollectionPagesSchema,
	layoutBlockHtmlSchema,
	layoutBlockPubsSchema,
	layoutBlockTextSchema,
	layoutBlockCollectionHeaderSchema,
	layoutBlockSubmissionBannerSchema,
]) satisfies z.ZodType<types.MaybeHas<types.LayoutBlock, 'id'>>;
