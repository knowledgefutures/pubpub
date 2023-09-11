import { AppRoute } from '@ts-rest/core';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';

extendZodWithOpenApi(z);

export const logoutRoute = {
	path: '/api/logout',
	method: 'GET',
	summary: 'Logout',
	description: 'Logout and clear authentication cookie',
	responses: {
		200: z.literal('success').openapi({
			description: `Successfully logged out.\n The sesion ID is cleared from the cookie named \`connect.sid\`, and future requests will not be authenticated.`,
		}),
	},
} satisfies AppRoute;
