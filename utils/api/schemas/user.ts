import { z } from 'zod';

import { MinimalUser, User, UserWithPrivateFields } from 'types';

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
	orcid: z.string().nullable(),
	googleScholar: z.string().nullable(),
	resetHashExpiration: z.coerce
		.date()
		.transform((d) => d.toString())
		.nullable() as z.ZodType<string | null>,
	resetHash: z.string().nullable(),
	inactive: z.boolean().nullable(),
	pubpubV3Id: z.number().nullable(),
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
	pubpubV3Id: true,
	inactive: true,
}) satisfies z.ZodType<User>;
