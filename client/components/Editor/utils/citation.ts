export const getCitationInlineLabel = (citationNode) => {
	const { count, citation, customLabel } = citationNode.attrs;
	if (customLabel) {
		return customLabel;
	}
	if (citation && citation.inline) {
		return citation.inline;
	}
	return `[${count}]`;
};
