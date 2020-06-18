const selectBranch = (pub, branch) => {
	if (!branch && !pub.branches) {
		return null;
	}
	return branch || pub.branches.find((br) => br.title === 'public');
};

export const getPubLatestReleasedDate = (pub) => {
	if (pub.releases.length === 0) {
		return null;
	}
	return pub.releases
		.map((release) => new Date(release.createdAt))
		.reduce((latestDate, date) => {
			return date > latestDate ? date : latestDate;
		});
};

export const getPubCreatedDate = (pub) => {
	return pub.createdAt;
};

export const getPubPublishedDate = (pub) => {
	if (pub.customPublishedAt) {
		return pub.customPublishedAt;
	}
	const { releases } = pub;
	if (releases.length > 0) {
		const [firstRelease] = releases;
		return new Date(firstRelease.createdAt);
	}
	return null;
};

export const getPubLatestReleaseDate = (pub, { excludeFirstRelease = false } = {}) => {
	const { releases } = pub;
	if (releases.length === 1 && excludeFirstRelease) {
		return null;
	}
	const latestRelease = releases[releases.length - 1];
	if (latestRelease) {
		return new Date(latestRelease.createdAt);
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
