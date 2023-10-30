import * as types from 'types';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { collectionKinds, readNextPreviewSizes } from 'types/collection';
import { layoutBlockSchema } from './layout';

extendZodWithOpenApi(z);

const collectionLayoutSchema = z.object({
	isNarrow: z.boolean().optional(),
	blocks: z.array(layoutBlockSchema),
});

export const collectionSchema = z.object({
	id: z.string().uuid(),
	title: z
		.string()
		.openapi({ description: 'The title of the collection', example: 'A wonderful title' }),
	slug: z
		.string()
		.regex(/^[a-zA-Z0-9-]+$/)
		.min(1)
		.max(280),
	avatar: z.string().url().nullable(),
	isRestricted: z.boolean().nullable(),
	isPublic: z.boolean().nullable(),
	viewHash: z.string().nullable(),
	editHash: z.string().nullable(),
	metadata: z.record(z.any()).nullable(),
	kind: z.enum(collectionKinds).nullable(),
	doi: z.string().nullable(),
	readNextPreviewSize: z.enum(readNextPreviewSizes).default('choose-best'),
	layout: collectionLayoutSchema,
	layoutAllowsDuplicatePubs: z.boolean().default(false),
	pageId: z.string().uuid().nullable(),
	communityId: z.string().uuid(),
	scopeSummaryId: z.string().uuid().nullable(),
	crossrefDepositRecordId: z.string().uuid().nullable(),
}) satisfies z.ZodType<types.Collection, any, any>;

export const collectionCreationSchema = collectionSchema
	.omit({ id: true })
	.pick({
		communityId: true,
		title: true,
		pageId: true,
		doi: true,
		isPublic: true,
		isRestricted: true,
		slug: true,
	})
	.required({
		communityId: true,
		title: true,
	})
	.partial({
		pageId: true,
		doi: true,
		isPublic: true,
		isRestricted: true,
		slug: true,
	})
	.extend({ kind: collectionSchema.shape.kind.unwrap() });

export const collectionUpdateSchema = collectionSchema
	.pick({
		title: true,
		slug: true,
		isRestricted: true,
		isPublic: true,
		pageId: true,
		metadata: true,
		readNextPreviewSize: true,
		layout: true,
		layoutAllowsDuplicatePubs: true,
		avatar: true,
		doi: true,
	})
	.partial()
	.extend({
		id: collectionSchema.shape.id,
		communityId: collectionSchema.shape.communityId,
	});

export const collectionRemoveSchema = z.object({
	id: collectionSchema.shape.id,
	communityId: collectionSchema.shape.communityId,
});
