import { Attribution, AttributionWithUser, isAttributionWithUser } from 'utils/types';

import { getPartsOfFullName } from './names';

/**
 * Attaches a `user` prop to an attribution object if one doesn't already exist, i.e. if the
 * attributed author isn't present on PubPub.
 * TODO(ian): I think we should move towards doing this normalization in the database.
 */
export default (attribution: Attribution): AttributionWithUser => {
	if (isAttributionWithUser(attribution) && attribution.user.id !== attribution.id) {
		return attribution;
	}
	const { id, name, avatar, title, orcid } = attribution;
	const { firstName, lastName, initials } = getPartsOfFullName(name);
	const spreadableAttribution =
		// If we're on the server someone may have given us a Sequelize object.
		// @ts-ignore
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
};
