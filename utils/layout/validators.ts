import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { MaybeHas, docJsonSchema } from 'types';
import { generateHash } from 'utils/hashes';
import {
	LayoutBlock,
	LayoutBlockBanner,
	LayoutBlockCollectionHeader,
	LayoutBlockCollectionsPages,
	LayoutBlockHtml,
	LayoutBlockPubs,
	LayoutBlockSubmissionBanner,
	LayoutBlockText,
	pubPreviewTypes,
	pubSortOrders,
	textAligns,
} from './types';

extendZodWithOpenApi(z);

export const layoutBlockBannerSchema = z
	.object({
		type: z.literal('banner'),
		id: z.string().default(generateHash(8)),
		content: z.object({
			align: z.enum(['left', 'center']).optional(),
			backgroundColor: z.string().optional(),
			backgroundHeight: z.enum(['tall', 'narrow']).optional(),
			backgroundImage: z.string().optional(),
			backgroundSize: z.enum(['full', 'standard']).optional(),
			buttonText: z.string().optional(),
			buttonType: z.enum(['link', 'signup', 'create-pub']).optional(),
			buttonUrl: z.string().optional(),
			showButton: z.boolean().optional(),
			text: z.string().optional(),
		}),
	})
	.openapi({
		title: 'Banner block',
	}) satisfies z.ZodType<MaybeHas<LayoutBlockBanner, 'id'>>;

export const layoutBlockCollectionPagesSchema = z
	.object({
		type: z.literal('collections-pages'),
		id: z.string().default(generateHash(8)),
		content: z.object({
			items: z.array(
				z.object({
					type: z.enum(['collection', 'page']),
					id: z.string(),
				}),
			),
			title: z.string().optional(),
			justify: z.enum(['left', 'center', 'space-between', 'space-around']).optional(),
		}),
	})
	.openapi({
		title: 'Collection/pages block',
	}) satisfies z.ZodType<MaybeHas<LayoutBlockCollectionsPages, 'id'>>;

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
	}) satisfies z.ZodType<MaybeHas<LayoutBlockHtml, 'id'>>;

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
	}) satisfies z.ZodType<MaybeHas<LayoutBlockPubs, 'id'>>;

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
	}) satisfies z.ZodType<MaybeHas<LayoutBlockText, 'id'>>;

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
	}) satisfies z.ZodType<MaybeHas<LayoutBlockCollectionHeader, 'id'>>;

export const layoutBlockSubmissionBannerSchema = z
	.object({
		type: z.literal('submission-banner'),
		id: z.string().default(generateHash(8)).default(generateHash(8)),
		content: z.object({
			title: z.string(),
			body: docJsonSchema,
			submissionWorkflowId: z.string(),
		}),
	})
	.openapi({
		title: 'Submission banner block',
	}) satisfies z.ZodType<MaybeHas<LayoutBlockSubmissionBanner, 'id'>>;

export const layoutBlockSchema = z.discriminatedUnion('type', [
	layoutBlockBannerSchema,
	layoutBlockCollectionPagesSchema,
	layoutBlockHtmlSchema,
	layoutBlockPubsSchema,
	layoutBlockTextSchema,
	layoutBlockCollectionHeaderSchema,
	layoutBlockSubmissionBannerSchema,
]) satisfies z.ZodType<MaybeHas<LayoutBlock, 'id'>>;
