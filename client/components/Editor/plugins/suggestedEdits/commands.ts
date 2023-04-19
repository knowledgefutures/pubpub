import { Command, EditorState } from 'prosemirror-state';

import { Dispatch, createCommandSpec } from '../../commands';

import {
	isSuggestedEditsEnabled,
	getSuggestedEditsState,
	updateSuggestedEditsState,
} from './state';
import { acceptSuggestedEdits, rejectSuggestedEdits } from './resolve';

const toggleSuggestedEditsCommand: Command = (state: EditorState, dispatch?: Dispatch) => {
	const pluginState = getSuggestedEditsState(state);
	if (pluginState) {
		if (dispatch) {
			updateSuggestedEditsState(dispatch, state, { isEnabled: !pluginState.isEnabled });
		}
		return true;
	}
	return false;
};

export const toggleSuggestedEditsSpec = createCommandSpec((dispatch, state) => {
	const isEnabled = isSuggestedEditsEnabled(state);
	return {
		isActive: isEnabled,
		canRun: toggleSuggestedEditsCommand(state),
		run: () => toggleSuggestedEditsCommand(state, dispatch),
	};
});

export const acceptSuggestedEditSpec = createCommandSpec((dispatch, state) => {
	return {
		isActive: false,
		canRun: acceptSuggestedEdits(state),
		run: () => acceptSuggestedEdits(state, dispatch),
	};
});

export const rejectSuggestedEditSpec = createCommandSpec((dispatch, state) => {
	return {
		isActive: false,
		canRun: rejectSuggestedEdits(state),
		run: () => rejectSuggestedEdits(state, dispatch),
	};
});
