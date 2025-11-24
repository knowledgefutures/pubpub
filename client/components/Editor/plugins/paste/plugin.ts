import type { NodeType, Schema } from 'prosemirror-model';

import type { PluginsOptions } from '../../types';
import type { PluginState } from './types';

import { type EditorState, Plugin, type Transaction } from 'prosemirror-state';
import { DecorationSet } from 'prosemirror-view';

import { getFinishedUploadFromTransaction, getNextDecorationsForTransaction } from './decorations';
import { createDropHandler, createPasteHandler } from './handlers';
import { pastePluginKey } from './key';
import { defaultMediaUploadHandler } from './upload';

export default (schema: Schema, options: PluginsOptions) => {
	const { mediaUploadHandler = defaultMediaUploadHandler } = options;
	if (!schema.nodes.image || options.isReadOnly) {
		return [];
	}
	return new Plugin<PluginState>({
		key: pastePluginKey,
		state: {
			init: (_, editorState: EditorState): PluginState => {
				return {
					decorations: DecorationSet.create(editorState.doc, []),
				};
			},
			apply: (tr: Transaction, pluginState: PluginState) => {
				const { decorations } = pluginState;
				const nextDecorations = getNextDecorationsForTransaction(tr, decorations);
				return {
					...pluginState,
					decorations: nextDecorations,
				};
			},
		},
		props: {
			handleDOMEvents: {
				paste: createPasteHandler(mediaUploadHandler),
				drop: createDropHandler(mediaUploadHandler),
			},
			decorations: function (editorState: EditorState) {
				let decorations: DecorationSet | undefined;
				if (this instanceof Plugin) {
					const pluginState = this.getState(editorState);
					if (pluginState) {
						decorations = pluginState.decorations;
					}
				}
				return decorations;
			},
		},
		appendTransaction: (
			trs: readonly Transaction[],
			oldState: EditorState,
			newState: EditorState,
		) => {
			for (let i = 0; i < trs.length; i++) {
				const tr = trs[i];
				const finished = getFinishedUploadFromTransaction(tr, oldState);
				if (finished) {
					const { src, position } = finished;
					return newState.tr.insert(
						position,
						(schema.nodes.image as NodeType).create({ url: src }),
					);
				}
			}
			return null;
		},
	});
};

export const editorHasPasteDecorations = (state: EditorState) => {
	const pluginState = pastePluginKey.getState(state) as PluginState;
	if (pluginState) {
		return pluginState.decorations.find().length > 0;
	}
	return false;
};
