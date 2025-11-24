import type { AppRouter } from '@ts-rest/core';

import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const authRouter = {
	/**
	 * `POST /api/login`
	 *
	 * Login and returns authentication cookie
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-login/post}
	 */
	login: {
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
	},

	/**
	 * `GET /api/logout`
	 *
	 * Logout and clear authentication cookie
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-logout/get}
	 */
	logout: {
		path: '/api/logout',
		method: 'GET',
		summary: 'Logout',
		description: 'Logout and clear authentication cookie',
		responses: {
			200: z.literal('success').openapi({
				description: `Successfully logged out.\n The sesion ID is cleared from the cookie named \`connect.sid\`, and future requests will not be authenticated.`,
			}),
		},
	},
} as const satisfies AppRouter;

type AuthType = typeof authRouter;

export interface AuthRouter extends AuthType {}
