import { Plugin } from 'prosemirror-state';
import { DecorationSet, Decoration } from 'prosemirror-view';
import { collabDocPluginKey } from './collaborative';
import { docIsEmpty } from '../utils';

export default (schema, props) => {
	return new Plugin({
		props: {
			decorations: (state) => {
				const doc = state.doc;
				if (docIsEmpty(doc) && props.placeholder) {
					const decorations = [];
					state.doc.descendants((node, pos) => {
						const collaborativePluginState = collabDocPluginKey.getState(state) || {};
						const placeholderText =
							props.collaborativeOptions.clientData &&
							!collaborativePluginState.isLoaded
								? 'Loading...'
								: props.placeholder;
						if (node.type.isBlock && node.childCount === 0) {
							decorations.push(
								Decoration.node(pos, pos + node.nodeSize, {
									class: 'prosemirror-placeholder',
									'data-content': placeholderText,
								}),
							);
						}
					});
					return DecorationSet.create(state.doc, decorations);
				}
				return null;
			},
		},
	});
};
