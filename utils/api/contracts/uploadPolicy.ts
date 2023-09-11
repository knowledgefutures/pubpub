import { AppRoute } from '@ts-rest/core';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';

extendZodWithOpenApi(z);

export const uploadPolicyRoute = {
	path: '/api/uploadPolicy',
	method: 'GET',
	summary: 'Get upload policy',
	description: 'Get upload policy',
	query: z.object({
		contentType: z.string(),
	}),
	responses: {
		200: z.object({
			acl: z.string(),
			awsAccessKeyId: z.string(),
			policy: z.string(),
			signature: z.string(),
			bucket: z.string(),
		}),
	},
} satisfies AppRoute;
