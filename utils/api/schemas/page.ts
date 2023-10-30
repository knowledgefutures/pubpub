import { z } from 'zod';
import * as types from 'types';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { Page } from 'server/models';
import { layoutBlockSchema } from './layout';

extendZodWithOpenApi(z);

export const pageSchema = z.object({
	id: z.string().uuid(),
	title: z.string().nonempty(),
	slug: z.string().nonempty().openapi({
		description: 'The URL slug for the page',
	}),
	description: z.string().nullable(),
	avatar: z.string().url().nullable().openapi({
		description: 'URL of the preview image',
	}),
	isPublic: z.boolean().default(false),
	isNarrowWidth: z.boolean().nullable(),
	viewHash: z.string().nullable(),
	layout: z.array(layoutBlockSchema).openapi({
		description: 'The layout of the page, as an array of blocks.',
	}),
	layoutAllowsDuplicatePubs: z.boolean().default(false).openapi({
		description: 'Whether the page allows pubs to reappear in subsequent pub blocks.',
	}),
	communityId: z.string().uuid(),
}) satisfies z.ZodType<types.Page, any, any>;

export const pageCreateSchema = pageSchema
	.pick({
		communityId: true,
		title: true,
		slug: true,
		description: true,
		avatar: true,
	})
	.partial({
		description: true,
		avatar: true,
	});

export const pageUpdateSchema = pageSchema
	.omit({ id: true })
	.partial()
	.required({
		communityId: true,
	})
	.extend({
		pageId: pageSchema.shape.id,
	}) satisfies types.UpdateParams<Page>;

export const pageRemoveSchema = z.object({
	communityId: z.string().uuid(),
	pageId: z.string().uuid(),
});
