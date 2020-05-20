export const getCitationInlineLabel = (count, customLabel, citationInlineStyle, citationData) => {
	if (customLabel) {
		return customLabel;
	}
	if (citationData && citationData.inline && citationData.inline[citationInlineStyle]) {
		return citationData.inline[citationInlineStyle];
	}
	return `[${count}]`;
};
