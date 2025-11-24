import type { AppRouter } from '@ts-rest/core';

import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';

import { analyticsEventSchema } from '../schemas/analytics';

extendZodWithOpenApi(z);

export const analyticsRouter = {
	track: {
		path: '/api/analytics/track',
		method: 'POST',
		summary: 'Track event',
		body: analyticsEventSchema,
		responses: {
			204: z.never().optional(),
		},
	},
} satisfies AppRouter;

type AnalyticsRouterType = typeof analyticsRouter;

export interface AnalyticsRouter extends AnalyticsRouterType {}
