import { Node, ResolvedPos } from 'prosemirror-model';
import { NodeSelection, Selection, TextSelection } from 'prosemirror-state';

export const moveSelectionToStart = (editorView) => {
	/* Create transaction and set selection to the beginning of the doc */
	const { tr } = editorView.state;
	tr.setSelection(Selection.atStart(editorView.state.doc));

	/* Dispatch transaction to setSelection and insert content */
	editorView.dispatch(tr);
};

export const moveSelectionToEnd = (editorView) => {
	/* Create transaction and set selection to the end of the doc */
	const { tr } = editorView.state;
	tr.setSelection(Selection.atEnd(editorView.state.doc));

	/* Dispatch transaction to setSelection and insert content */
	editorView.dispatch(tr);
};

export const moveToStartOfSelection = (editorView) => {
	const { tr } = editorView.state;
	editorView.dispatch(tr.setSelection(new TextSelection(editorView.state.selection.$from)));
};

export const moveToEndOfSelection = (editorView) => {
	const { tr } = editorView.state;
	editorView.dispatch(tr.setSelection(new TextSelection(editorView.state.selection.$to)));
};

export const marksAtSelection = (editorView) => {
	return editorView.state.selection.$from.marks().map((mark) => {
		return mark.type.name;
	});
};

export const setEditorSelectionFromClick = (editorView, clickEvent) => {
	const { clientX, clientY } = clickEvent;
	const posAtCoords = editorView.posAtCoords({ left: clientX, top: clientY });
	if (posAtCoords) {
		const { pos, inside } = posAtCoords;
		const txn = editorView.state.tr;
		const insideNode = editorView.state.doc.nodeAt(inside);
		if (NodeSelection.isSelectable(insideNode)) {
			const selection = NodeSelection.create(editorView.state.doc, inside);
			txn.setSelection(selection);
		} else {
			const resolvedPos = editorView.state.doc.resolve(pos);
			const selection = Selection.near(resolvedPos);
			txn.setSelection(selection);
		}
		txn.setMeta('latestDomEvent', clickEvent);
		editorView.dispatch(txn);
	}
};

type NodePredicate = (node: Node) => boolean;

export const findParentNode = (predicate: NodePredicate) => ({ $from }: Selection) =>
	findParentNodeClosestToPos($from, predicate);

export const findParentNodeClosestToPos = ($pos: ResolvedPos, predicate: NodePredicate) => {
	for (let i = $pos.depth; i > 0; i--) {
		const node = $pos.node(i);
		if (predicate(node)) {
			return {
				pos: i > 0 ? $pos.before(i) : 0,
				start: $pos.start(i),
				depth: i,
				node,
			};
		}
	}
};
