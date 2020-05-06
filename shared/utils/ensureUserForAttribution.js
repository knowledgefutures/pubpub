/**
 * Attaches a `user` prop to an attribution object if one doesn't already exist, i.e. if the
 * attributed author isn't present on PubPub.
 * TODO(ian): I think we should move towards doing this normalization in the database.
 */
export default (attribution) => {
	if (!attribution.user || attribution.user.id === attribution.id) {
		const { id, name, avatar, title, orcid } = attribution;
		return {
			...attribution,
			user: {
				isShadowUser: true,
				id: id,
				initials: name[0],
				fullName: name,
				firstName: name
					.split(' ')
					.slice(0, -1)
					.join(' '),
				lastName: name.split(' ').pop(),
				avatar: avatar,
				title: title,
				orcid: orcid,
			},
		};
	}
	return attribution;
};
