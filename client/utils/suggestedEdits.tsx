import { getSuggestionAttrsForNode } from 'client/components/Editor/plugins/suggestedEdits/operations';
import { EditorChangeObject } from 'client/components/Editor';

export const hasSuggestions = (editorChangeObject: null | EditorChangeObject): boolean => {
	if (!editorChangeObject || !editorChangeObject.view) return false;
	const doc = editorChangeObject.view.state.doc;
	let hasSuggestion = false;
	doc.nodesBetween(0, doc.nodeSize - 2, (node) => {
		if (hasSuggestion) return;
		const present = getSuggestionAttrsForNode(node);
		if (present) hasSuggestion = true;
	});
	return hasSuggestion;
};
