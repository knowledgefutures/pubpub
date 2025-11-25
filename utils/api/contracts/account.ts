import type { AppRouter } from '@ts-rest/core';

import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

const passwordChangeSchema = z
	.object({
		currentPassword: z.string().openapi({
			description: 'The SHA3 hash of the users current password',
		}),
		newPassword: z.string().openapi({
			description: 'The SHA3 hash of the users new password',
		}),
	})
	.openapi({
		description:
			'Password validation (minimum length, etc) should be done client-side before hashing',
	});

const emailChangeInitiateSchema = z.object({
	newEmail: z.string().email('Must be a valid email address'),
	password: z.string().openapi({
		description: 'The SHA3 hash of the users password',
	}),
});

const emailChangeCompleteSchema = z.object({
	token: z.string().min(1, 'Token is required'),
});

const successResponseSchema = z.object({
	success: z.boolean(),
});

const emailChangeCompleteResponseSchema = successResponseSchema.extend({
	newEmail: z.string().email(),
});

export const accountRouter = {
	changePassword: {
		method: 'PUT',
		path: '/api/account/password',
		summary: 'Change password',
		description: 'Change the current users password',
		body: passwordChangeSchema,
		responses: {
			200: successResponseSchema,
			403: z.object({ message: z.string() }),
		},
	},
	initiateEmailChange: {
		method: 'POST',
		path: '/api/account/email',
		summary: 'Initiate email change',
		description: 'Request an email change for the current user',
		body: emailChangeInitiateSchema,
		responses: {
			200: successResponseSchema,
			400: z.object({ message: z.string() }),
			403: z.object({ message: z.string() }),
		},
	},
	completeEmailChange: {
		method: 'PUT',
		path: '/api/account/email',
		summary: 'Complete email change',
		description: 'Complete an email change using the token from the confirmation email',
		body: emailChangeCompleteSchema,
		responses: {
			200: emailChangeCompleteResponseSchema,
			400: z.object({ message: z.string() }),
		},
	},
} as const satisfies AppRouter;

type AccountType = typeof accountRouter;

export interface AccountRouter extends AccountType {}
