import type * as types from 'types';

import { z } from 'zod';

import { baseSchema } from '../utils/baseSchema';
import { analyticsSettingsSchema } from './analyticsSettings';

const communityHeaderLinkSchema = z.object({
	title: z.string(),
	url: z.string(),
	external: z.boolean().optional(),
});

const communityHeroButtonSchema = z.object({
	title: z.string(),
	url: z.string(),
});

const communityNavigationChildSchema = z.union([
	z.object({
		id: z.string(),
		type: z.enum(['page', 'collection']),
	}),
	z.object({
		id: z.string(),
		title: z.string(),
		href: z.string(),
	}),
]);

const communityNavigationMenuSchema = z.object({
	id: z.string(),
	title: z.string(),
	children: z.array(communityNavigationChildSchema),
});

const communityNavigationEntrySchema = z.union([
	communityNavigationChildSchema,
	communityNavigationMenuSchema,
]);

export const communitySchema = baseSchema.extend({
	subdomain: z
		.string()
		.min(1)
		.max(280)
		.regex(/^[a-zA-Z0-9-]+$/),
	domain: z.string().nullable(),
	title: z.string(),
	citeAs: z.string().nullable(),
	publishAs: z.string().nullable(),
	description: z.string().max(280).nullable(),
	avatar: z.string().nullable(),
	favicon: z.string().nullable(),
	accentColorLight: z.string(),
	accentColorDark: z.string(),
	hideCreatePubButton: z.boolean().nullable(),
	headerLogo: z.string().nullable(),
	headerLinks: z.array(communityHeaderLinkSchema).nullable(),
	headerColorType: z.enum(['light', 'dark', 'custom']).nullable(),
	useHeaderTextAccent: z.boolean().nullable(),
	hideHero: z.boolean().nullable(),
	hideHeaderLogo: z.boolean().nullable(),
	heroLogo: z.string().nullable(),
	heroBackgroundImage: z.string().nullable(),
	heroBackgroundColor: z.string().nullable(),
	heroTextColor: z.string().nullable(),
	useHeaderGradient: z.boolean().nullable(),
	heroImage: z.string().nullable(),
	heroTitle: z.string().nullable(),
	heroText: z.string().nullable(),
	heroPrimaryButton: communityHeroButtonSchema.nullable(),
	heroSecondaryButton: communityHeroButtonSchema.nullable(),
	heroAlign: z.string().nullable(),
	navigation: z.array(communityNavigationEntrySchema).nullable(),
	hideNav: z.boolean().nullable(),
	navLinks: z.array(communityNavigationEntrySchema).nullable(),
	footerLinks: z.array(communityNavigationEntrySchema).nullable(),
	footerLogoLink: z.string().nullable(),
	footerTitle: z.string().nullable(),
	footerImage: z.string().nullable(),
	website: z.string().nullable(),
	facebook: z.string().nullable(),
	twitter: z.string().nullable(),
	instagram: z.string().nullable(),
	mastodon: z.string().nullable(),
	linkedin: z.string().nullable(),
	bluesky: z.string().nullable(),
	github: z.string().nullable(),
	email: z.string().nullable(),
	socialLinksLocation: z.enum(['header', 'footer']).nullable(),
	issn: z.string().nullable(),
	isFeatured: z.boolean().nullable(),
	viewHash: z.string().nullable(),
	editHash: z.string().nullable(),
	premiumLicenseFlag: z.boolean().nullable().default(false),
	defaultPubCollections: z.array(z.string()).nullable(),
	spamTagId: z.string().uuid().nullable(),
	organizationId: z.string().uuid().nullable(),
	scopeSummaryId: z.string().uuid().nullable(),
	accentTextColor: z.string(),
	analyticsSettings: analyticsSettingsSchema,
}) satisfies z.ZodType<types.Community, any, any>;

export const communityCreateSchema = communitySchema
	.pick({
		subdomain: true,
		title: true,
		description: true,
		headerLogo: true,
		heroLogo: true,
		heroTitle: true,
		accentColorLight: true,
		accentColorDark: true,
	})
	.partial({
		headerLogo: true,
		heroLogo: true,
		heroTitle: true,
		description: true,
	});

export const communityUpdateSchema = communitySchema
	.partial()
	.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		communityId: communitySchema.shape.id,
		discussionCreationAccess: z.enum(['public', 'contributors-members', 'disabled']).optional(),
	});
