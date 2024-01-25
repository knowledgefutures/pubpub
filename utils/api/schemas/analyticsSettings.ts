import { z } from 'zod';

const defaultCredentialsSchema = z.object({
	type: z.literal('default'),
	credentials: z.null(),
});

const googleTagCredentialsSchema = z.object({
	type: z.literal('GTM'),
	credentials: z.literal(`GTM-${z.string()}`),
});

const googleAnalyticsCredentialsSchema = z.object({
	type: z.literal('GA'),
	credentials: z.literal(`GA-${z.string()}`),
});

export const analyticsSettingsSchema = z
	.discriminatedUnion('type', [
		defaultCredentialsSchema,
		googleTagCredentialsSchema,
		googleAnalyticsCredentialsSchema,
	])
	.default({
		type: 'default',
		credentials: null,
	});
