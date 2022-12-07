import { Plugin, PluginKey } from 'prosemirror-state';
import { undo, redo } from 'prosemirror-history';
import { EditorView } from 'prosemirror-view';
import { Node } from 'prosemirror-model';
import { Classes } from '@blueprintjs/core';

import { CodeBlockSettings, LanguageLoaders } from './types';
import { codeMirrorBlockNodeView } from './codeMirrorBlockNodeView';
import { codeBlockArrowHandlers } from './utils';
import { CodeBlockLanguages } from './languages';
import { defaultSettings } from './defaults';
import languageLoaders from './languageLoaders';
import parsers from './parsers';

export const codeMirrorBlockKey = new PluginKey('codemirror-block');

const codeMirrorBlockPlugin = (settings: CodeBlockSettings) => {
	return new Plugin({
		key: codeMirrorBlockKey,
		props: {
			nodeViews: {
				code_block: codeMirrorBlockNodeView(settings),
			},
		},
	});
};

export {
	codeMirrorBlockNodeView,
	codeBlockArrowHandlers,
	codeMirrorBlockPlugin,
	CodeBlockSettings,
	LanguageLoaders,
	CodeBlockLanguages,
	defaultSettings,
	parsers,
	languageLoaders,
};

const createSelect = (
	settings: CodeBlockSettings,
	dom: HTMLElement,
	node: Node,
	view: EditorView,
	getPos: (() => number) | boolean,
) => {
	if (!settings.languageLoaders) return () => {};
	const wrapper = document.createElement('div');
	wrapper.classList.add(Classes.HTML_SELECT, 'codeblock-select-wrapper');
	const select = document.createElement('select');
	const carets = document.createElement('span');
	carets.classList.add(Classes.ICON, `${Classes.ICON}-caret-down`);
	wrapper.append(select);
	wrapper.append(carets);
	select.className = 'codeblock-select';
	const noneOption = document.createElement('option');
	noneOption.value = 'none';
	noneOption.textContent = settings.languageNameMap?.none || 'none';
	select.append(noneOption);
	Object.keys(languageLoaders)
		.sort()
		.forEach((lang) => {
			if (settings.languageWhitelist && !settings.languageWhitelist.includes(lang)) return;
			const option = document.createElement('option');
			option.value = lang;
			option.textContent = settings.languageNameMap?.[lang] || lang;
			select.append(option);
		});
	select.value = node.attrs.lang || 'none';
	dom.prepend(wrapper);
	select.onchange = async (e) => {
		if (!(e.target instanceof HTMLSelectElement)) return;
		const lang = e.target.value === 'none' ? null : e.target.value;
		if (typeof getPos === 'function') {
			view.dispatch(
				view.state.tr.setNodeMarkup(getPos(), undefined, {
					...node.attrs,
					lang,
				}),
			);
		}
	};
	return () => {};
};

export default (schema, pluginsOptions) => {
	if (schema.nodes.code_block) {
		return [
			codeMirrorBlockPlugin({
				...defaultSettings,
				readOnly: pluginsOptions.isReadOnly,
				createSelect,
				languageLoaders,
				undo,
				redo,
			}),
		];
	}
	return [];
};
