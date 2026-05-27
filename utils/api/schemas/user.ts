import type { MinimalUser, User, UserWithPrivateFields } from 'types';

import { z } from 'zod';

import { ORCID_ID_OR_URL_PATTERN, ORCID_PATTERN } from 'utils/orcid';

export const privateUserSchema = z.object({
	id: z.string().uuid(),
	slug: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	fullName: z.string(),
	initials: z.string(),
	avatar: z.string().nullable(),
	bio: z.string().nullable(),
	title: z.string().nullable(),
	email: z.string().email(),
	publicEmail: z.string().email().nullable(),
	authRedirectHost: z.string().nullable(),
	location: z.string().nullable(),
	website: z.string().nullable(),
	facebook: z.string().nullable(),
	twitter: z.string().nullable(),
	github: z.string().nullable(),
	orcid: z
		.string()
		.regex(ORCID_ID_OR_URL_PATTERN)
		.transform((orcid) => orcid.match(ORCID_PATTERN)?.[0]!)
		.nullable()
		.or(z.literal('')),
	googleScholar: z.string().nullable(),
	resetHashExpiration: z.coerce
		.date()
		.transform((d) => d.toString())
		.nullable() as z.ZodType<string | null>,
	resetHash: z.string().nullable(),
	passwordDigest: z.string().nullable(),
	hash: z.string(),
	salt: z.string(),
	gdprConsent: z.boolean().nullable(),
	isSuperAdmin: z.boolean(),
	// For associations, we can't validate them using Zod at this level. They are usually validated in service or controller level.
}) satisfies z.ZodType<UserWithPrivateFields>;

export const minimalUserSchema = privateUserSchema.pick({
	id: true,
	slug: true,
	initials: true,
	fullName: true,
	firstName: true,
	lastName: true,
	avatar: true,
	title: true,
	orcid: true,
	isShadowUser: true,
	publicEmail: true,
	feedback: true,
}) satisfies z.ZodType<MinimalUser>;

export const userSchema = privateUserSchema.omit({
	isSuperAdmin: true,
	passwordDigest: true,
	hash: true,
	salt: true,
	email: true,
	resetHash: true,
	resetHashExpiration: true,
	gdprConsent: true,
}) satisfies z.ZodType<User>;
