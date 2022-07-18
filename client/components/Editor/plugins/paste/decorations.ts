import { EditorState, Transaction } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

import { pastePluginKey } from './key';
import { Meta, PluginState } from './types';
import { createPlaceholderWidgetElement } from './widget';

type PlaceholderDecoration = Decoration;

export const createPlaceholderDecoration = (
	id: string,
	position: number,
	progress: number,
): PlaceholderDecoration => {
	return Decoration.widget(position, () => createPlaceholderWidgetElement(progress), {
		id,
		key: `${id}-${progress}`,
	});
};

const getPlaceholderDecorationForId = (
	id: string,
	decorations: DecorationSet,
): null | PlaceholderDecoration => {
	const [matchingDecoration] = decorations.find(undefined, undefined, (spec) => spec.id === id);
	if (matchingDecoration) {
		return matchingDecoration as PlaceholderDecoration;
	}
	return null;
};

export const getNextDecorationsForTransaction = (tr: Transaction, decorations: DecorationSet) => {
	const pluginMeta = tr.getMeta(pastePluginKey) as Meta;
	const nextDecorations = decorations.map(tr.mapping, tr.doc);
	if (pluginMeta) {
		if (pluginMeta.type === 'uploadFinish' || pluginMeta.type === 'uploadFailure') {
			const { id } = pluginMeta;
			const decorationsToRemove = nextDecorations.find(
				0,
				tr.doc.nodeSize,
				(spec) => spec.id === id,
			);
			return nextDecorations.remove(decorationsToRemove);
		}
		if (pluginMeta.type === 'uploadStart') {
			const { id, position } = pluginMeta;
			return nextDecorations.add(tr.doc, [createPlaceholderDecoration(id, position, 0)]);
		}
		if (pluginMeta.type === 'uploadProgress') {
			const { id, progress } = pluginMeta;
			const currentDecoration = getPlaceholderDecorationForId(id, decorations);
			if (currentDecoration) {
				const { to: position } = currentDecoration;
				const nextDecoration = createPlaceholderDecoration(id, position, progress);
				return nextDecorations.remove([currentDecoration]).add(tr.doc, [nextDecoration]);
			}
		}
	}
	return nextDecorations;
};

export const getFinishedUploadFromTransaction = (tr: Transaction, state: EditorState) => {
	const meta = tr.getMeta(pastePluginKey) as Meta;
	if (meta && meta.type === 'uploadFinish') {
		const { src, id } = meta;
		const { decorations } = pastePluginKey.getState(state) as PluginState;
		const decoration = getPlaceholderDecorationForId(id, decorations);
		if (decoration) {
			return { src, position: decoration.to };
		}
	}
	return null;
};
