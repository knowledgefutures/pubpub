import { EditorState } from 'prosemirror-state';
import { splitBlock } from 'prosemirror-commands';
import pick from 'lodash.pick';

import { Dispatch } from './types';

export const splitBlockPreservingAttrs = (attrs: string[]) => {
	return (state: EditorState, dispatch?: Dispatch) => {
		const { $from: previousSelectionFrom } = state.selection;
		return splitBlock(state, (tr) => {
			if (dispatch) {
				const targetNodePosition = tr.selection.$from.before();
				const targetNode = tr.doc.nodeAt(targetNodePosition);
				const sourceNode = previousSelectionFrom.node();
				tr.setNodeMarkup(targetNodePosition, undefined, {
					...targetNode?.attrs,
					...pick(sourceNode.attrs, attrs),
				});
				dispatch(tr);
			}
		});
	};
};
