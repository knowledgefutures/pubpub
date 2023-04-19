import { EditorState, Command, NodeSelection } from 'prosemirror-state';

import { createCommandSpec } from './util';
import { Dispatch } from './types';

const toggleKind: Command = (state: EditorState, dispatch?: Dispatch) => {
	const { node } = state.selection as NodeSelection;
	const canRun = node && (node.type.name === 'math_inline' || node.type.name === 'math_display');
	if (!canRun) {
		return false;
	}
	const isDisplay = node.type.name === 'math_display';
	if (dispatch) {
		const {
			schema: {
				nodes: { math_display: displayType, math_inline: inlineType },
			},
		} = state;
		const swapNodeType = isDisplay ? inlineType : displayType;
		const transaction = state.tr.replaceSelectionWith(
			swapNodeType.create({}, node.content),
			true,
		);
		dispatch(transaction);
	}
	return true;
};

const toggleLabel: Command = (state: EditorState, dispatch?: Dispatch) => {
	const { node, $anchor } = state.selection as NodeSelection;
	const canRun = node && node.type.name === 'math_display';
	if (!canRun) return false;
	if (dispatch) {
		const transaction = state.tr.setNodeMarkup(
			$anchor.pos,
			node.type,
			{
				hideLabel: !node.attrs.hideLabel,
			},
			node.marks,
		);
		dispatch(transaction);
	}
	return true;
};

export const mathToggleKind = createCommandSpec((dispatch, state) => ({
	run: () => toggleKind(state, dispatch),
	canRun: toggleKind(state),
	isActive: false,
}));
export const mathToggleLabel = createCommandSpec((dispatch, state) => ({
	run: () => toggleLabel(state, dispatch),
	canRun: toggleLabel(state),
	isActive: false,
}));
