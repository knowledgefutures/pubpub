export default (threads, canView, loginId) => {
	return threads.filter((thread) => {
		if (thread.visibility === 'public') {
			return true;
		}
		if (thread.visibility === 'members') {
			return canView;
		}
		if (thread.visibility === 'private') {
			return thread.threadUsers.find((threadUser) => {
				return threadUser.userId === loginId;
			});
		}
		return false;
	});
};
