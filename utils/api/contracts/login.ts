import { AppRoute } from '@ts-rest/core';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';

extendZodWithOpenApi(z);

export const loginRoute = {
	path: '/api/login',
	method: 'POST',
	summary: 'Login',
	description: 'Login and returns authentication cookie',
	body: z
		.object({
			email: z.string().email(),
			password: z.string().openapi({
				description: 'The SHA3 hash of the user’s password',
			}),
		})
		.openapi({
			description: 'A JSON object containing the user’s email and hashed password',
		}),
	responses: {
		201: z.literal('success').openapi({
			description: `Successfully authenticated.\n The sesion ID is returned in a cookie named \`connect.sid\` and should be included in all subsequent requests.`,
		}),
		401: z.literal('Login attempt failed').openapi({}),
		500: z.string().openapi({}),
	},
} satisfies AppRoute;
