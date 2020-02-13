const selectBranch = (pub, branch) => {
	if (!branch && !pub.branches) {
		return null;
	}
	return branch || pub.branches.find((br) => br.title === 'public');
};

export const getPubPublishedDate = (pub, branch = null) => {
	const selectedBranch = selectBranch(pub, branch);
	if (selectedBranch) {
		if (pub.branches && !pub.branches.some((br) => br.id === selectedBranch.id)) {
			throw new Error(`Branch ${selectedBranch.id} not a member of pub ${pub.id}!`);
		}
		if (selectedBranch.firstKeyAt) {
			return new Date(selectedBranch.firstKeyAt);
		}
		if (selectedBranch.latestKeyAt) {
			return new Date(selectedBranch.latestKeyAt);
		}
	}
	return null;
};

export const getPubUpdatedDate = ({ pub, branch = null, historyData = null }) => {
	if (historyData) {
		const { timestamps, latestKey } = historyData;
		if (timestamps && typeof latestKey === 'number') {
			const latestTimestamp = timestamps[latestKey];
			return new Date(latestTimestamp);
		}
	}
	const selectedBranch = selectBranch(pub, branch);
	if (selectedBranch) {
		if (selectedBranch.latestKeyAt) {
			return new Date(selectedBranch.latestKeyAt);
		}
	}
	return null;
};
