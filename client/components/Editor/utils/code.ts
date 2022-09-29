import { EditorState } from 'prosemirror-state';

export const isInCodeBlock = (state: EditorState): boolean => {
	const { $anchor } = state.selection;
	for (let d = $anchor.depth; d > 0; d--)
		if ($anchor.node(d).type.name === 'code_block') return true;
	return false;
};

export const languageModes = {
	javascript: {
		label: 'javascript',
		importMode: () => import('@codemirror/lang-javascript'),
	},
	markdown: {
		label: 'markdown',
		importMode: () => import('@codemirror/lang-markdown'),
	},
	html: {
		label: 'html',
		importMode: () => import('@codemirror/lang-html'),
	},
	sql: {
		label: 'sql',
		importMode: () => import('@codemirror/lang-sql'),
	},
	python: {
		label: 'python',
		importMode: () => import('@codemirror/lang-python'),
	},
	cpp: {
		label: 'c++',
		importMode: () => import('@codemirror/lang-cpp'),
	},
	java: {
		label: 'java',
		importMode: () => import('@codemirror/lang-java'),
	},
	php: {
		label: 'php',
		importMode: () => import('@codemirror/lang-php'),
	},
	css: {
		label: 'css',
		importMode: () => import('@codemirror/lang-css'),
	},
};

export type LanguageName = keyof typeof languageModes;
export const languageNames = Object.keys(languageModes) as LanguageName[];
