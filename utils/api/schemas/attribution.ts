import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { PubAttribution } from 'server/models';
import * as types from 'types';
import { DEFAULT_ROLES } from 'types/attribution';

extendZodWithOpenApi(z);

export const attributionSchema = z.object({
	id: z.string().uuid(),
	order: z.number().max(1).min(0),
	roles: z.array(z.string()).openapi({ example: DEFAULT_ROLES }).nullable(),
	affiliation: z.string().nullable(),
	isAuthor: z.boolean().nullable(),
	userId: z.string().uuid().nullable(),
	name: z.string().nullable(),
	orcid: z.string().nullable(),
	avatar: z.string().url().nullable(),
	title: z.string().nullable().openapi({
		deprecated: true,
		description: 'Legacy field, do not use.',
	}),
}) satisfies z.ZodType<Omit<types.PubAttribution, 'pubId'>>;

export const attributionCreationSchema = attributionSchema
	.omit({ id: true, pubId: true, userId: true, name: true, orcid: true })
	.partial()
	.merge(
		z.object({
			order: attributionSchema.shape.order.default(0.5),
			roles: attributionSchema.shape.roles.default([]),
			affiliation: attributionSchema.shape.affiliation.optional(),
			isAuthor: attributionSchema.shape.isAuthor.optional(),
		}),
	)
	.and(
		z.union([
			z.object({
				userId: attributionSchema.shape.userId.unwrap(),
				name: z.undefined().optional(),
				orcid: z.undefined().optional(),
			}),
			z.object({
				userId: z.undefined().nullish(),
				name: attributionSchema.shape.name.unwrap(),
				orcid: attributionSchema.shape.orcid.optional(),
			}),
		]),
	) satisfies z.ZodType<
	Omit<types.PubAttributionCreationParams, 'order' | 'pubId'> & { order?: number }
>;

export const updateAttributionSchema = attributionSchema
	.omit({ id: true })
	.partial()
	.merge(attributionSchema.pick({ id: true })) satisfies Omit<
	z.ZodType<types.UpdateParams<PubAttribution>>,
	'pubId'
>;
