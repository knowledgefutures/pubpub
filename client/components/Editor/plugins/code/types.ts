import { EditorState, Transaction } from 'prosemirror-state';
import { Node } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
import { Extension } from '@codemirror/state';
import { LanguageSupport, LRLanguage } from '@codemirror/language';
import { LRParser } from '@lezer/lr';
import { MarkdownParser } from '@lezer/markdown';
import { sql } from '@codemirror/lang-sql';

import { CodeBlockLanguages } from './languages';

type LanguageName = typeof CodeBlockLanguages[number];

export type LanguageLoaders = Record<LanguageName, () => Promise<LanguageSupport>>;

const sqlParser = sql().language.parser;
type SQLParser = typeof sqlParser;

export type Parsers = Record<
	LanguageName[number],
	LRLanguage['parser'] | LRParser | MarkdownParser | SQLParser
>;

export type CodeBlockSettings = {
	createSelect: (
		settings: CodeBlockSettings,
		dom: HTMLElement,
		node: Node,
		view: EditorView,
		getPos: (() => number) | boolean,
	) => () => void;
	updateSelect: (
		settings: CodeBlockSettings,
		dom: HTMLElement,
		node: Node,
		view: EditorView,
		getPos: (() => number) | boolean,
		oldNode: Node,
	) => void;
	stopEvent: (
		e: Event,
		node: Node,
		getPos: (() => number) | boolean,
		view: EditorView,
		dom: HTMLElement,
	) => boolean;
	languageLoaders?: LanguageLoaders;
	languageNameMap?: Record<string, string>;
	languageWhitelist?: string[];
	undo?: (state: EditorState, dispatch: (tr: Transaction) => void) => void;
	redo?: (state: EditorState, dispatch: (tr: Transaction) => void) => void;
	theme?: Extension[];
	readOnly: boolean;
};
