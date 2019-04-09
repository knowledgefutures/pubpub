export default (attributions) => {
	return attributions
		.map((attribution) => {
			if (attribution.user) {
				return attribution;
			}
			return {
				...attribution,
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
		})
		.sort((a, b) => a.order - b.order);
};
