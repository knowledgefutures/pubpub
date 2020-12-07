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
		? [...new Set([...attributesPublicUser, ...providedAttrs])]
		: attributesPublicUser;
	return {
		model: User,
		attributes: attributes,
		...restOptions,
	};
};
