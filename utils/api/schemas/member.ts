import { z } from 'zod';
// import * as types from 'types';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';

extendZodWithOpenApi(z);

export const memberPermissions = ['view', 'edit', 'manage', 'admin'] as const;
export const memberSchema = z.object({
	id: z.string().uuid(),
	permissions: z.enum(memberPermissions).default('view'),
	isOwner: z.boolean().nullable(),
	subscribedToActivityDigest: z.boolean().default(false),
	userId: z.string().uuid(),
	pubId: z.string().uuid().nullable(),
	collectionId: z.string().uuid().nullable(),
	communityId: z.string().uuid().nullable(),
	organizationId: z.string().uuid().nullable(),
});

export const idUnionSchema = z.object({
	communityId: memberSchema.shape.communityId.unwrap(),
	collectionId: memberSchema.shape.collectionId.optional(),
	pubId: memberSchema.shape.pubId.optional(),
});

export const memberCreateSchema = z
	.object({
		value: z.object({
			permissions: memberSchema.shape.permissions,
		}),
		targetUserId: z.string().uuid(),
	})
	.and(idUnionSchema);

export const memberUpdateSchema = z
	.object({
		id: memberSchema.shape.id,
		value: z.object({
			permissions: z.enum(memberPermissions).optional(),
			subscribedToActivityDigest: z.boolean().optional(),
		}),
	})
	.and(idUnionSchema);

export const memberRemoveSchema = z
	.object({
		id: memberSchema.shape.id,
	})
	.and(idUnionSchema);
