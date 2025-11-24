import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

import { viewIsEmpty } from '../utils';
import { collabDocPluginKey } from './collaborative';

export default (schema, props) => {
	return new Plugin({
		props: {
			decorations: (state) => {
				if (viewIsEmpty(state) && props.placeholder) {
					const decorations = [];
					state.doc.descendants((node, pos) => {
						const collaborativePluginState = collabDocPluginKey.getState(state) || {};
						const placeholderText =
							props.collaborativeOptions?.clientData &&
							!collaborativePluginState.isLoaded
								? 'Loading...'
								: props.placeholder;
						if (node.type.isBlock && node.childCount === 0) {
							decorations.push(
								// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'Decoration<{ [key: string]: any;... Remove this comment to see the full error message
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
