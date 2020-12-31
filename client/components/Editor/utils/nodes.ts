import { Node } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';

export const updateNodeAttrsById = (editorView: EditorView, id: string, attrs: Node['attrs']) => {
	const {
		state: { doc, tr },
	} = editorView;
	let foundNode: Node | null = null;
	let foundNodePos: number | null = null;
	// eslint-disable-next-line consistent-return
	doc.descendants((node: Node, pos: number) => {
		if (node.attrs.id === id) {
			foundNodePos = pos;
			foundNode = node;
		}
		if (foundNode !== null) {
			return false;
		}
	});
	if (foundNode && foundNodePos !== null) {
		tr.setNodeMarkup(foundNodePos, undefined, { ...(foundNode as Node).attrs, ...attrs });
		editorView.dispatch(tr);
	}
};
