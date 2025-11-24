import type { Page } from 'server/models';
import type * as types from 'types';

import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';

import { baseSchema } from '../utils/baseSchema';
import { communitySchema } from './community';
import { layoutBlockSchema } from './layout';

extendZodWithOpenApi(z);

export const pageSchema = baseSchema.extend({
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
		isPublic: true,
		isNarrowWidth: true,
		layout: true,
		layoutAllowsDuplicatePubs: true,
	})
	.partial({
		description: true,
		avatar: true,
		isPublic: true,
		isNarrowWidth: true,
		layout: true,
		layoutAllowsDuplicatePubs: true,
	});

export const pageUpdateSchema = pageSchema
	.omit({ id: true, updatedAt: true, createdAt: true })
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

export const pageWithRelationsSchema = pageSchema.extend({
	community: communitySchema.optional(),
});
