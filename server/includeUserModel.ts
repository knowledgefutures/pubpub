/* eslint-disable pubpub-rules/no-user-model */

export const attributesPublicUser = [
	'id',
	'firstName',
	'lastName',
	'fullName',
	'avatar',
	'slug',
	'initials',
	'title',
	'orcid',
];

export const createIncludeUserModel = (User) => ({ attributes: providedAttrs, ...restOptions }) => {
	const attributes = providedAttrs
		? // @ts-expect-error ts-migrate(2569) FIXME: Type 'Set<any>' is not an array type or a string t... Remove this comment to see the full error message
		  [...new Set([...attributesPublicUser, ...providedAttrs])]
		: attributesPublicUser;
	return {
		model: User,
		attributes: attributes,
		...restOptions,
	};
};
