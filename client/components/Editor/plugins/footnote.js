import { Plugin } from 'prosemirror-state';

export default (schema) => {
	if (!schema.nodes.footnote) {
		return [];
	}
	return new Plugin({
		appendTransaction: (transactions, oldState, newState) => {
			let footnoteCount = 1;
			const footnoteItems = [];
			let didUpdate = false;
			const newTransaction = newState.tr;
			newState.doc.nodesBetween(0, newState.doc.nodeSize - 2, (node, nodePos) => {
				if (node.type.name === 'footnote') {
					if (node.attrs.count !== footnoteCount) {
						didUpdate = true;
						newTransaction.setNodeMarkup(nodePos, null, {
							...node.attrs,
							count: footnoteCount,
						});
						newTransaction.setMeta('footnote', true);
					}
					footnoteItems.push({
						count: footnoteCount,
						value: node.attrs.value,
						structuredValue: node.attrs.structuredValue,
					});
					footnoteCount += 1;
				}
				return true;
			});

			return didUpdate ? newTransaction : null;
		},
	});
};
