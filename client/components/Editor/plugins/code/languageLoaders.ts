import { LanguageLoaders } from './types';

const languageLoaders: LanguageLoaders = {
	cpp: () => import('@codemirror/lang-cpp').then((i) => i.cpp()),
	css: () => import('@codemirror/lang-css').then((i) => i.css()),
	html: () => import('@codemirror/lang-html').then((i) => i.html()),
	sql: () => import('@codemirror/lang-sql').then((i) => i.sql()),
	xml: () => import('@codemirror/lang-xml').then((i) => i.xml()),
	javascript: () => import('@codemirror/lang-javascript').then((i) => i.javascript()),
	java: () => import('@codemirror/lang-java').then((i) => i.java()),
	json: () => import('@codemirror/lang-json').then((i) => i.json()),
	markdown: () => import('@codemirror/lang-markdown').then((i) => i.markdown()),
	python: () => import('@codemirror/lang-python').then((i) => i.python()),
	rust: () => import('@codemirror/lang-rust').then((i) => i.rust()),
};

export default languageLoaders;
