import { z } from 'zod';

const googleAnalyticsCredentialsSchema = z.object({
	type: z.literal('google-analytics'),
	credentials: z.string().regex(/^G-[A-Z0-9]+$/),
});

const simpleAnalyticsCredentialsSchema = z.object({
	type: z.literal('simple-analytics'),
	credentials: z.null(),
});

/**
 * Schema for analytics settings.
 *
 * `null` means only our own analytics are enabled.
 */
export const analyticsSettingsSchema = z
	.discriminatedUnion('type', [
		googleAnalyticsCredentialsSchema,
		simpleAnalyticsCredentialsSchema,
	])
	.nullable()
	.default(null);
