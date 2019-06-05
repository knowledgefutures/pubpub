/**
 * Attaches a `user` prop to an attribution object if one doesn't already exist, i.e. if the
 * attributed author isn't present on PubPub.
 * TODO(ian): I think we should move towards doing this normalization in the database.
 */
export default (attribution) => {
	if (attribution.user) {
		return attribution;
	}
	return {
		// TODO(ian): this will break code that expects the returned value to still be a Sequelize
		// model rather than a plain object.
		...(attribution.dataValues || attribution),
		user: {
			id: attribution.id,
			initials: attribution.name[0],
			fullName: attribution.name,
			firstName: attribution.name.split(' ')[0],
			lastName: attribution.name
				.split(' ')
				.slice(1, attribution.name.split(' ').length)
				.join(' '),
			avatar: attribution.avatar,
			title: attribution.title,
		},
	};
};
