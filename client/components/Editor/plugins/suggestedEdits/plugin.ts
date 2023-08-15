import { Schema } from 'prosemirror-model';
import { EditorState, Plugin, Transaction } from 'prosemirror-state';

import { Decoration, DecorationSet } from 'prosemirror-view';
import { PluginsOptions } from '../..';

import { SuggestedEditsPluginState } from './types';
import { getInitialPluginState } from './state';
import { appendTransaction } from './appendTransaction';
import { suggestedEditsPluginKey } from './key';
import { getSuggestionRanges } from './ranges';
import { getResolvableRangeForSelection } from './resolve';

export default (schema: Schema, options: PluginsOptions) => {
	const { collaborativeOptions } = options;
	return new Plugin<SuggestedEditsPluginState>({
		key: suggestedEditsPluginKey,
		appendTransaction,
		state: {
			init: () => getInitialPluginState(schema, collaborativeOptions?.clientData?.id!),
			apply: (
				tr: Transaction,
				pluginState: SuggestedEditsPluginState,
				_,
				newState: EditorState,
			) => {
				const { hasComputedSuggestionRanges } = pluginState;
				const meta = tr.getMeta(suggestedEditsPluginKey);
				const shouldComputeSuggestionRanges = tr.docChanged || !hasComputedSuggestionRanges;
				const suggestionRanges = shouldComputeSuggestionRanges
					? getSuggestionRanges(newState.doc)
					: pluginState.suggestionRanges;
				return {
					...pluginState,
					...meta?.updatedState,
					suggestionRanges,
					hasComputedSuggestionRanges:
						hasComputedSuggestionRanges || shouldComputeSuggestionRanges,
				};
			},
		},
		props: {
			decorations(state) {
				// Add a .selected class to any suggestion range that is intersected by the selection
				const decorations: Decoration[] = [];
				const suggestionRange = getResolvableRangeForSelection(state);
				if (!suggestionRange) {
					return null;
				}
				state.doc.nodesBetween(
					suggestionRange.from,
					suggestionRange.to,
					(node, position) => {
						if (node.isLeaf) {
							decorations.push(
								Decoration.inline(position, position + node.nodeSize, {
									class: 'selected',
								}),
							);
						}
					},
				);

				return DecorationSet.create(state.doc, decorations);
			},
		},
	});
};
