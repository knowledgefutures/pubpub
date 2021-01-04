import { Node, ResolvedPos } from 'prosemirror-model';
import { Selection, TextSelection, NodeSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

type NodePredicate = (node: Node) => boolean;

export const moveSelectionToStart = (editorView: EditorView) => {
	/* Create transaction and set selection to the beginning of the doc */
	const { tr } = editorView.state;
	tr.setSelection(Selection.atStart(editorView.state.doc));

	/* Dispatch transaction to setSelection and insert content */
	editorView.dispatch(tr);
};

export const moveSelectionToEnd = (editorView: EditorView) => {
	/* Create transaction and set selection to the end of the doc */
	const { tr } = editorView.state;
	tr.setSelection(Selection.atEnd(editorView.state.doc));

	/* Dispatch transaction to setSelection and insert content */
	editorView.dispatch(tr);
};

export const moveToStartOfSelection = (editorView: EditorView) => {
	const { tr } = editorView.state;
	editorView.dispatch(tr.setSelection(new TextSelection(editorView.state.selection.$from)));
};

export const moveToEndOfSelection = (editorView: EditorView) => {
	const { tr } = editorView.state;
	editorView.dispatch(tr.setSelection(new TextSelection(editorView.state.selection.$to)));
};

export const marksAtSelection = (editorView) => {
	return editorView.state.selection.$from.marks().map((mark) => {
		return mark.type.name;
	});
};

export const mouseEventSelectsNode = (editorView: EditorView, mouseEvent: MouseEvent) => {
	const { clientX, clientY } = mouseEvent;
	try {
		const posAtCoords = editorView.posAtCoords({ left: clientX, top: clientY });
		if (posAtCoords) {
			const { inside } = posAtCoords;
			const insideNode = editorView.state.doc.nodeAt(inside);
			if (insideNode && NodeSelection.isSelectable(insideNode)) {
				return true;
			}
		}
	} catch (err) {
		if (err instanceof RangeError) {
			return false;
		}
		throw err;
	}
	return false;
};

export const findParentNodeClosestToPos = ($pos: ResolvedPos, predicate: NodePredicate) => {
	for (let i = $pos.depth; i > 0; i--) {
		const node = $pos.node(i);
		if (predicate(node)) {
			return {
				pos: i > 0 ? $pos.before(i) : 0,
				start: $pos.start(i),
				depth: i,
				node: node,
			};
		}
	}
	return null;
};

export const findParentNode = (predicate: NodePredicate) => ({ $from }: Selection) =>
	findParentNodeClosestToPos($from, predicate);
