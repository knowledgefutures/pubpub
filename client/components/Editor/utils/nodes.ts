import type { Node } from 'prosemirror-model';
import type { Selection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

export const updateNodeAttrsById = (editorView: EditorView, id: string, attrs: Node['attrs']) => {
	const {
		state: { doc, tr },
	} = editorView;
	let foundNode: Node | null = null;
	let foundNodePos: number | null = null;

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
		tr.setNodeMarkup(
			foundNodePos,
			undefined,
			{ ...(foundNode as Node).attrs, ...attrs },
			(foundNode as any).marks,
		);
		editorView.dispatch(tr);
	}
};

export const insertNodeIntoEditor = (view: EditorView, nodeType: string, attrs?: Node['attrs']) => {
	const { schema, tr } = view.state;
	const nodeSchema = schema.nodes[nodeType];
	if (nodeSchema.spec.onInsert) {
		nodeSchema.spec.onInsert(view, attrs);
	} else {
		const node = nodeSchema.create(attrs);
		const transaction = tr.replaceSelectionWith(node);
		view.dispatch(transaction);
	}
};

export const isDescendantOf = (nodeTypeName: string, selection: Selection): boolean => {
	const { $anchor } = selection;
	for (let d = $anchor.depth; d > 0; d--)
		if ($anchor.node(d).type.name === nodeTypeName) return true;
	return false;
};
