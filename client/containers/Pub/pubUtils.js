// The "formatted download" is the file that the pub manager can upload themselves to represent the
// pub. It's stored in pub.downloads, but it's treated as a kind of special case.
export const getFormattedDownload = (downloads) => {
	if (!downloads) {
		return null;
	}
	return downloads.reduce((prev, curr) => {
		const currIsNewer = !prev || !prev.createdAt || curr.createdAt > prev.createdAt;
		if (curr.type === 'formatted' && currIsNewer) {
			return curr;
		}
		return prev;
	}, null);
};

// Finds a download for the given branchId and formatType
export const getExistingDownload = (downloads, branchId, formatType) => {
	return downloads.find((download) => {
		const sameBranch = download.branchId === branchId;
		const sameType = download.type === formatType.format;
		return sameType && sameBranch;
	});
};
