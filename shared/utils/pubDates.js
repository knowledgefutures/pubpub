export const getPubPublishedDate = (pub, branch) => {
	// eslint-disable-next-line no-param-reassign
	branch = branch || pub.branches.find((br) => br.title === 'public');
	if (branch) {
		if (!pub.branches.some((br) => br.id === branch.id)) {
			throw new Error(`Branch ${branch.id} not a member of pub ${pub.id}!`);
		}
		if (branch.publishedAt) {
			return new Date(branch.publishedAt);
		}
		if (branch.updatedAt) {
			return new Date(branch.updatedAt);
		}
	}
	return null;
};
