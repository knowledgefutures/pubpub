export default (threads, activePermissions, loginId) => {
	const { canView, canAdmin } = activePermissions;
	return threads.filter((thread) => {
		if (thread.visibility === 'public') {
			return true;
		}
		if (thread.visibility === 'members') {
			return canView;
		}
		if (thread.visibility === 'private') {
			return (
				canAdmin ||
				thread.threadUsers.find((threadUser) => {
					return threadUser.userId === loginId;
				})
			);
		}
		return false;
	});
};
