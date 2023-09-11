// These are the names that Pandoc uses
export const pandocTargets = [
	'html',
	'pdf',
	'docx',
	'epub',
	'markdown',
	'odt',
	'plain',
	'jats_archiving',
	'latex',
	'json',
] as const;
export type PandocTarget = (typeof pandocTargets)[number];

// These are our names for the same things
export const exportFormatsArray = [
	'html',
	'pdf',
	'docx',
	'epub',
	'markdown',
	'odt',
	'plain',
	'jats',
	'tex',
	'json',
] as const;
export type ExportFormat = (typeof exportFormatsArray)[number];

type ExportFormatDescription = {
	extension: string;
	title: string;
} & ({ pagedTarget?: true } | { pandocTarget: PandocTarget });

const exportFormats: Record<ExportFormat, ExportFormatDescription> = {
	html: { extension: 'html', title: 'HTML' },
	pdf: { extension: 'pdf', pagedTarget: true, title: 'PDF' },
	docx: { pandocTarget: 'docx', extension: 'docx', title: 'Word' },
	epub: { pandocTarget: 'epub', extension: 'epub', title: 'EPUB' },
	markdown: { pandocTarget: 'markdown', extension: 'md', title: 'Markdown' },
	odt: { pandocTarget: 'odt', extension: 'odt', title: 'OpenDocument' },
	plain: { pandocTarget: 'plain', extension: 'txt', title: 'Plain Text' },
	jats: { pandocTarget: 'jats_archiving', extension: 'xml', title: 'JATS XML' },
	tex: { pandocTarget: 'latex', extension: 'tex', title: 'LaTeX' },
	json: { pandocTarget: 'json', extension: 'json', title: 'JSON' },
} as const;

export const getExportFormats = () => Object.keys(exportFormats);
export const getExportFormatDetails = (key) => exportFormats[key];
