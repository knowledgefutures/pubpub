import { Fragment, Node } from 'prosemirror-model';
import { EditorView, NodeView, Decoration } from 'prosemirror-view';

type NodeViewArgs = [Node, EditorView, boolean | (() => number), Decoration[]];
type NodeViewConstructor = (...args: NodeViewArgs) => MathNodeView;

interface MathNodeView extends NodeView {
	_node: Node;
	renderMath: () => unknown;
}

const addCountToNode = (node: Node, count: number) => {
	const {
		content,
		type: { schema },
	} = node;
	const countLatex = `\\tag{${count}}`;
	const textNode = schema.text(countLatex);
	const contentWithCount = Fragment.from(content).append(Fragment.from(textNode));
	return node.copy(contentWithCount);
};

export const mathViewOverrideWithCount = (constructor: NodeViewConstructor) => {
	return (...args: NodeViewArgs) => {
		const delegate = constructor(...args);
		const { renderMath } = delegate;
		const boundRenderMath = renderMath.bind(delegate);
		Object.assign(delegate, {
			renderMath: function (this: MathNodeView) {
				const oldNode = this._node;
				// We should have access to the `count` reactive attr if node labels
				// for math are currently enabled
				const { count, id } = oldNode.attrs;
				const updatedNode = count ? addCountToNode(oldNode, count) : oldNode;
				this._node = updatedNode;
				// render the count-appended node...
				boundRenderMath();
				// ...but don't retain the count in the document
				this._node = oldNode;
				(this.dom as HTMLElement).setAttribute('id', id);
			},
		});
		delegate.renderMath();
		return delegate;
	};
};
