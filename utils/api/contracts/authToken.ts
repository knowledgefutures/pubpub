import type { AppRouter } from '@ts-rest/core';

import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

const authTokenMetadata = z.object({
	id: z.string().uuid(),
	userId: z.string().uuid(),
	communityId: z.string().uuid(),
	lastFour: z.string(),
	expiresAt: z.string().datetime().nullable(),
	createdAt: z.string().datetime(),
});

const authTokenCommunityRef = z.object({
	id: z.string().uuid(),
	title: z.string(),
	subdomain: z.string(),
});

const authTokenUserRef = z.object({
	id: z.string().uuid(),
	fullName: z.string().nullable().optional(),
	slug: z.string().nullable().optional(),
	avatar: z.string().nullable().optional(),
	initials: z.string().nullable().optional(),
});

export const authTokenRouter = {
	create: {
		path: '/api/authTokens',
		method: 'POST',
		summary: 'Create a new authentication token',
		description:
			'Create a new authentication token. Only accessible to admins. Tokens are scoped to a specific community and user.',
		body: z.object({
			communityId: z.string().uuid().openapi({
				description: 'The ID of the community to which the token will be scoped',
			}),
			expiresAt: z.enum(['never', '1d', '1w', '1m', '3m', '1y']).openapi({
				description: 'The expiration date of the token',
			}),
		}),
		responses: {
			201: z.object({
				id: z.string().uuid(),
				userId: z.string().uuid(),
				communityId: z.string().uuid(),
				lastFour: z.string(),
				token: z.string().openapi({
					description:
						'The raw token. Shown exactly once at creation. It is hashed before being persisted and cannot be retrieved later.',
				}),
				expiresAt: z.string().datetime().nullable(),
			}),
		},
	},
	getForUser: {
		path: '/api/authTokens',
		method: 'GET',
		summary: 'List the current user’s authentication tokens',
		description:
			'List authentication tokens owned by the current user. The token secret is never returned by this endpoint — only metadata.',
		responses: {
			200: z.array(
				authTokenMetadata.extend({
					community: authTokenCommunityRef.nullable().optional(),
				}),
			),
		},
	},
	getForCommunity: {
		path: '/api/authTokens/community/:communityId',
		method: 'GET',
		summary: 'List authentication tokens scoped to a community',
		description:
			'List authentication tokens scoped to a community. Only accessible to admins of that community. The token secret is never returned.',
		pathParams: z.object({
			communityId: z.string().uuid(),
		}),
		responses: {
			200: z.array(
				authTokenMetadata.extend({
					user: authTokenUserRef.nullable().optional(),
				}),
			),
		},
	},
	remove: {
		path: '/api/authTokens/:id',
		method: 'DELETE',
		summary: 'Delete an authentication token',
		description: 'Delete an authentication token. Only accessible to admins.',
		pathParams: z.object({
			id: z.string().uuid(),
		}),
		body: z.union([z.null(), z.object({})]).optional(),
		responses: {
			200: z.string().uuid(),
		},
	},
	removeForCommunity: {
		path: '/api/authTokens/community/:communityId/:id',
		method: 'DELETE',
		summary: 'Revoke a token scoped to a community',
		description:
			'Revoke an authentication token scoped to a community. Accessible to any admin of that community, regardless of whether they minted the token.',
		pathParams: z.object({
			communityId: z.string().uuid(),
			id: z.string().uuid(),
		}),
		body: z.union([z.null(), z.object({})]).optional(),
		responses: {
			200: z.string().uuid(),
		},
	},
	removeByToken: {
		path: '/api/authTokens',
		method: 'DELETE',
		summary: 'Delete an authentication token by token',
		description: 'Delete an authentication token by token. Only accessible to super admins.',
		body: z.object({
			token: z.string(),
		}),
		responses: {
			200: z.string().uuid(),
		},
	},
} as const satisfies AppRouter;

type AuthTokenType = typeof authTokenRouter;

export interface AuthTokenRouter extends AuthTokenType {}
