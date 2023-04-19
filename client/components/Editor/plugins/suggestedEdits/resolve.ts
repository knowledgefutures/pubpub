import { Attrs, Mark, Slice } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';

import { Dispatch } from '../../commands';

import { getSuggestionMarkTypeFromSchema } from './operations';
import { suggestedEditsPluginKey } from './key';
import { getSuggestedEditsState } from './state';
import { SuggestionMarkAttrs, SuggestionNodeAttrs } from './types';
import { suggestionNodeAttributes } from './schema';

const getResolvableRangeForSelection = (
	state: EditorState,
): null | { from: number; to: number } => {
	const { selection } = state;
	const suggestedEditsState = getSuggestedEditsState(state);
	if (suggestedEditsState) {
		const { suggestionRanges } = suggestedEditsState;
		if (selection.from === selection.to) {
			const suggestionRange = suggestionRanges.find(
				(range) => range.from <= selection.from && selection.from <= range.to,
			);
			if (suggestionRange) {
				return suggestionRange;
			}
			return null;
		}
		return selection;
	}
	return null;
};

const removeSuggestionAttrs = (attrs: Attrs) => {
	const newAttrs: Record<string, any> = {};
	Object.keys(attrs).forEach((key) => {
		if (!suggestionNodeAttributes.includes(key)) {
			newAttrs[key] = attrs[key];
		}
	});
	return newAttrs as Attrs;
};

const acceptSuggestions = (state: EditorState, from: number, to: number) => {
	const { tr, doc } = state;
	tr.setMeta(suggestedEditsPluginKey, { resolving: true });
	const suggestionMarkType = getSuggestionMarkTypeFromSchema(doc.type.schema);
	doc.nodesBetween(from, to, (node, oldPos) => {
		const { attrs, marks, nodeSize } = node;
		const pos = tr.mapping.map(oldPos);
		const suggestionMark = marks.find((mark) => mark.type === suggestionMarkType);
		if (suggestionMark) {
			const { suggestionKind } = suggestionMark.attrs as SuggestionMarkAttrs;
			if (suggestionKind === 'addition' || suggestionKind === 'modification') {
				tr.removeMark(pos, pos + nodeSize, suggestionMark);
			}
			if (suggestionKind === 'removal') {
				tr.replace(pos, pos + nodeSize, Slice.empty);
			}
		}
		if (attrs.suggestionKind && !node.isText) {
			const { suggestionKind } = attrs as SuggestionNodeAttrs;
			tr.setNodeMarkup(pos, null, removeSuggestionAttrs(attrs), marks);
			if (suggestionKind === 'removal') {
				try {
					tr.join(pos);
				} catch (_) {
					tr.delete(pos, pos + nodeSize);
				}
			}
		}
	});
	return tr;
};

const rejectSuggestions = (state: EditorState, from: number, to: number) => {
	const { tr, doc } = state;
	const { schema } = doc.type;
	tr.setMeta(suggestedEditsPluginKey, { resolving: true });
	const suggestionMarkType = getSuggestionMarkTypeFromSchema(schema);
	doc.nodesBetween(from, to, (node, oldPos) => {
		const { attrs, marks, nodeSize } = node;
		const pos = tr.mapping.map(oldPos);
		const suggestionMark = marks.find((mark) => mark.type === suggestionMarkType);
		if (suggestionMark) {
			const { suggestionKind } = suggestionMark.attrs as SuggestionMarkAttrs;
			if (suggestionKind === 'removal') {
				tr.removeMark(pos, pos + nodeSize, suggestionMark);
			}
			if (suggestionKind === 'addition') {
				tr.replace(pos, pos + nodeSize, Slice.empty);
			}
			if (suggestionKind === 'modification') {
				tr.removeMark(pos, pos + nodeSize, null);
				const { suggestionOriginalMarks } = suggestionMark.attrs as SuggestionMarkAttrs;
				if (suggestionOriginalMarks) {
					const originalMarksJson = JSON.parse(suggestionOriginalMarks);
					const originalMarks: Mark[] = originalMarksJson.map((markJson) =>
						Mark.fromJSON(schema, markJson),
					);
					originalMarks.forEach((mark) => tr.addMark(pos, pos + nodeSize, mark));
				}
			}
		}
		if (attrs.suggestionKind && !node.isText) {
			const { suggestionKind, suggestionOriginalAttrs } = attrs as SuggestionNodeAttrs;
			const originalAttrs = suggestionOriginalAttrs
				? JSON.parse(suggestionOriginalAttrs)
				: null;
			tr.setNodeMarkup(
				pos,
				null,
				{ ...removeSuggestionAttrs(attrs), ...originalAttrs },
				marks,
			);
			if (suggestionKind === 'addition') {
				try {
					tr.join(pos);
				} catch (_) {
					tr.delete(pos, pos + nodeSize);
				}
			}
		}
	});
	return tr;
};

export const acceptSuggestedEdits = (state: EditorState, dispatch?: Dispatch): boolean => {
	const range = getResolvableRangeForSelection(state);
	if (range) {
		const tr = acceptSuggestions(state, range.from, range.to);
		if (dispatch) {
			dispatch(tr);
		}
		return true;
	}
	return false;
};

export const rejectSuggestedEdits = (state: EditorState, dispatch?: Dispatch): boolean => {
	const range = getResolvableRangeForSelection(state);
	if (range) {
		const tr = rejectSuggestions(state, range.from, range.to);
		if (dispatch) {
			dispatch(tr);
		}
		return true;
	}
	return false;
};
