import { Schema } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';

import { Dispatch } from '../../commands';
import { getSuggestionMarkTypeFromSchema } from './operations';

import { suggestedEditsPluginKey } from './key';
import { SuggestedEditsPluginState } from './types';

export const getInitialPluginState = (
	schema: Schema,
	suggestionUserId: string,
): SuggestedEditsPluginState => {
	return {
		suggestionUserId,
		isEnabled: false,
		hasComputedSuggestionRanges: false,
		suggestionMark: getSuggestionMarkTypeFromSchema(schema),
		suggestionRanges: [],
	};
};

export const getSuggestedEditsState = (state: EditorState): null | SuggestedEditsPluginState => {
	return suggestedEditsPluginKey.getState(state);
};

export const isSuggestedEditsEnabled = (state: EditorState) => {
	const pluginState = getSuggestedEditsState(state);
	if (pluginState) {
		return pluginState.isEnabled;
	}
	return false;
};

export const updateSuggestedEditsState = (
	dispatch: Dispatch,
	editorState: EditorState,
	updatedState: Partial<SuggestedEditsPluginState>,
) => {
	const { tr } = editorState;
	tr.setMeta(suggestedEditsPluginKey, { updatedState });
	dispatch(tr);
};
