export const getPDFDownload = (pub) => {
	const downloads = pub.downloads;
	const exports = pub.activeBranch.exports;
	if (downloads) {
		const matchingDownload = downloads.find((dl) => dl.url.endsWith('.pdf'));
		if (matchingDownload) return matchingDownload;
	}
	if (exports) {
		const matchingExport = exports.find((exportFile) => exportFile.format === 'pdf');
		if (matchingExport) return matchingExport;
	}
	return false;
};

export const getTextAbstract = (docJson) => {
	let abstract = '';
	if (!docJson) return abstract;
	const { content } = docJson;
	const [firstChild, secondChild] = content;
	const firstChildIsAbstractHeader =
		firstChild &&
		firstChild.type === 'heading' &&
		firstChild.attrs.level === 1 &&
		firstChild.content.length > 0 &&
		firstChild.content[0].text.toUpperCase() === 'abstract'.toUpperCase();
	if (firstChildIsAbstractHeader && secondChild) {
		const { content: abstractContent } = secondChild;
		if (abstractContent) {
			abstractContent.forEach((item) => {
				switch (item.type) {
					case 'text':
						abstract += item.text;
						if (item.marks) {
							item.marks.forEach((mark) => {
								if (mark.type === 'link') {
									abstract += ` <${mark.attrs.href}> `;
								}
							});
						}
						break;
					case 'equation':
						abstract += item.attrs.value;
						break;
					default:
						break;
				}
			});
		}
	}
	return abstract;
};
