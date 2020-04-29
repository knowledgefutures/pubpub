import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

const localHighlightsPluginKey = new PluginKey('localHighlights');

export default () => {
	return new Plugin({
		key: localHighlightsPluginKey,
		state: {
			init: (config, editorState) => {
				return {
					activeDecorationSet: DecorationSet.create(editorState.doc, []),
				};
			},
			apply: (transaction, pluginState, prevEditorState, editorState) => {
				const prevDecorationSet = pluginState.activeDecorationSet;

				const decorationsToRemove = prevDecorationSet.find().filter((decoration) => {
					return (
						decoration.spec.key === `lm-${transaction.meta.localHighlightIdToRemove}`
					);
				});

				const mappedDecorationSet = prevDecorationSet
					.remove(decorationsToRemove)
					.map(transaction.mapping, transaction.doc);

				/* If there is new highlight data, iterate over the data and */
				/* generate the new Decoration objects. */
				const newHighlightsData = transaction.meta.newLocalHighlightData || [];
				const newDecorations = newHighlightsData.map((highlightData) => {
					const className =
						highlightData.id === 'permanent'
							? 'permanent'
							: `local-highlight lh-${highlightData.id}`;
					const key =
						highlightData.id === 'permanent' ? 'permanent' : `lm-${highlightData.id}`;
					return Decoration.inline(
						Number(highlightData.from),
						Number(highlightData.to),
						{ class: className },
						{ key: key },
					);
				});

				const newDecorationWidgets = newHighlightsData
					.filter((highlightData) => {
						return highlightData.id !== 'permanent';
					})
					.map((highlightData) => {
						const elem = document.createElement('span');
						elem.className = `local-mount lm-${highlightData.id}`;

						return Decoration.widget(Number(highlightData.to), elem, {
							stopEvent: () => {
								return true;
							},
							key: `lm-${highlightData.id}`,
						});
					});

				return {
					activeDecorationSet: mappedDecorationSet.add(editorState.doc, [
						...newDecorations,
						...newDecorationWidgets,
					]),
				};
			},
		},
		props: {
			decorations: (editorState) => {
				return localHighlightsPluginKey.getState(editorState).activeDecorationSet;
			},
		},
	});
};
