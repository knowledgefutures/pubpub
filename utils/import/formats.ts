export const pandocFormatArray = [
	'docx+citations',
	'epub',
	'html',
	'markdown+tex_math_dollars',
	'odt',
	'markdown_strict',
	'jats',
	'latex',
] as const;

export type PandocFormat = (typeof pandocFormatArray)[number];

export const extensionToPandocFormat = {
	docx: 'docx+citations',
	epub: 'epub',
	html: 'html',
	md: 'markdown+tex_math_dollars',
	odt: 'odt',
	txt: 'markdown_strict',
	xml: 'jats',
	tex: 'latex',
} as const satisfies Record<string, PandocFormat>;

export type Extension = keyof typeof extensionToPandocFormat;

export const bibliographyFormats = [
	'bib',
	'bibtex',
	'copac',
	'json',
	'yaml',
	'enl',
	'xml',
	'wos',
	'medline',
	'mods',
	'nbib',
	'ris',
] as const;

export type BibliographyFormat = (typeof bibliographyFormats)[number];
