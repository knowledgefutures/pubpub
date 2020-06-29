import { getPartsOfFullName } from './names';
/**
 * Attaches a `user` prop to an attribution object if one doesn't already exist, i.e. if the
 * attributed author isn't present on PubPub.
 * TODO(ian): I think we should move towards doing this normalization in the database.
 */
export default (attribution) => {
	if (!attribution.user || attribution.user.id === attribution.id) {
		const { id, name, avatar, title, orcid } = attribution;
		const { firstName, lastName, initials } = getPartsOfFullName(name);
		const spreadableAttribution =
			typeof attribution.toJSON === 'function' ? attribution.toJSON() : attribution;
		return {
			...spreadableAttribution,
			user: {
				isShadowUser: true,
				id: id,
				initials: initials,
				fullName: name,
				firstName: firstName,
				lastName: lastName,
				avatar: avatar,
				title: title,
				orcid: orcid,
			},
		};
	}
	return attribution;
};
