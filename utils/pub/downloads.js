export const getFormattedDownloadUrl = (pubData) => {
	const { downloads } = pubData;
	if (!downloads) {
		return null;
	}
	const download = downloads.reduce((best, next) => {
		const isNewer = !best || !best.createdAt || next.createdAt > best.createdAt;
		if (next.type === 'formatted' && isNewer) {
			return next;
		}
		return best;
	}, null);
	if (download) {
		return download.url;
	}
	return null;
};

export const getPublicExportUrl = (pubData, format) => {
	const { branches, releases } = pubData;
	const publicBranch = branches.find((b) => b.title === 'public');
	if (publicBranch && publicBranch.exports && releases) {
		const latestHistoryKey = releases.map((r) => r.branchKey).reduce((a, b) => Math.max(a, b));
		if (typeof latestHistoryKey === 'number') {
			const validExport = publicBranch.exports.find(
				(exp) => exp.historyKey === latestHistoryKey && exp.format === format,
			);
			if (validExport) {
				return validExport.url;
			}
		}
	}
	return null;
};
