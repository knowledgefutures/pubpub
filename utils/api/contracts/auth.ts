import type { AppRouter } from '@ts-rest/core';

import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const authRouter = {
	/**
	 * `POST /api/login`
	 *
	 * Login and returns authentication cookie.
	 *
	 * @deprecated The SHA3-prehashed password flow is being retired in favour
	 * of API tokens (`/dashboard/settings/tokens`). The endpoint continues to
	 * work during the deprecation window, but accounts whose password has been
	 * reset through KF Auth will receive 410 Gone — those clients must
	 * migrate. Responses include `Deprecation`, `Sunset`, and `Link` headers.
	 *
	 * @access You need to be **logged in** and have access to this resource.
	 *
	 * @routeDocumentation
	 * {@link https://pubpub.org/apiDocs#/paths/api-login/post}
	 */
	login: {
		path: '/api/login',
		method: 'POST',
		summary: 'Login (deprecated)',
		description: 'Login and returns authentication cookie. Deprecated: prefer API tokens.',
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
			403: z.string().openapi({
				description:
					'Account restricted (e.g. marked as spam). Message is shown to the user.',
			}),
			410: z.string().openapi({
				description:
					'Account password has been migrated past the legacy SHA3 path. Switch to an API token.',
			}),
			500: z.string().openapi({}),
		},
	},

	/**
	 * `POST /api/login/fromForm`
	 *
	 * Login from a browser form, with captcha verification
	 */
	loginFromForm: {
		path: '/api/login/fromForm',
		method: 'POST',
		summary: 'Login from form',
		description: 'Login from a browser form with captcha verification',
		body: z.object({
			email: z.string().email(),
			password: z.string(),
			altcha: z.string(),
		}),
		responses: {
			201: z.literal('success'),
			400: z.string(),
			401: z.literal('Login attempt failed'),
			403: z.string(),
			410: z.string(),
			500: z.string(),
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
