const exportFormatTypes = {
	html: { extension: 'html', title: 'HTML' },
	pdf: { extension: 'pdf', pagedTarget: true, title: 'PDF' },
	docx: { pandocTarget: 'docx', extension: 'docx', title: 'Word' },
	epub: { pandocTarget: 'epub', extension: 'epub', title: 'EPUB' },
	markdown: { pandocTarget: 'markdown_strict', extension: 'md', title: 'Markdown' },
	odt: { pandocTarget: 'odt', extension: 'odt', title: 'OpenDocument' },
	plain: { pandocTarget: 'plain', extension: 'txt', title: 'Plain Text' },
	jats: { pandocTarget: 'jats', extension: 'xml', title: 'JATS XML' },
	tex: { pandocTarget: 'latex', extension: 'tex', title: 'LaTeX' },
};

export const getExportFormats = () => Object.keys(exportFormatTypes);
export const getExportFormatDetails = (key) => exportFormatTypes[key];
