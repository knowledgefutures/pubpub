export const ensureSerialized = (item) => {
	if (Array.isArray(item)) {
		return item.map(ensureSerialized);
	}
	if (item && typeof item === 'object') {
		if (typeof item.toJSON === 'function') {
			return item.toJSON();
		}
		const res = {};
		Object.keys(item).forEach((key) => {
			res[key] = ensureSerialized(item[key]);
		});
		return res;
	}
	return item;
};

export const sanitizeOnVisibility = (objectsWithVisibility, activePermissions, loginId) => {
	const { canView, canAdmin } = activePermissions;
	return objectsWithVisibility.filter((item) => {
		if (item.visibility.access === 'public') {
			return true;
		}
		if (item.visibility.access === 'members') {
			return canView;
		}
		if (item.visibility.access === 'private') {
			return (
				canAdmin ||
				item.visibility.users.find((user) => {
					return user.id === loginId;
				})
			);
		}
		return false;
	});
};
