import { Plugin } from 'prosemirror-state';

export default (schema, props) => {
	if (!schema.nodes.citation) {
		return [];
	}
	return new Plugin({
		appendTransaction: (transactions, oldState, newState) => {
			const { citationsRef, citationInlineStyle } = props;
			const counts = {}; /* counts is an object with items of the following form. { citationHtml: citationCount } */
			let didUpdate = false;
			const newTransaction = newState.tr;
			newState.doc.nodesBetween(0, newState.doc.nodeSize - 2, (node, nodePos) => {
				if (node.type.name === 'citation') {
					const key = `${node.attrs.value}-${node.attrs.unstructuredValue}`;
					const existingCount = counts[key] && counts[key].count;
					const nextCount = Object.keys(counts).length + 1;
					const newAttrs = { ...node.attrs };
					let didUpdateNode = false;
					if (existingCount && node.attrs.count !== existingCount) {
						/* If we already have a number for this citation, but */
						/* the current node doesn't have that number, then update. */
						didUpdateNode = true;
						newAttrs.count = existingCount;
					}
					if (!existingCount && node.attrs.count !== nextCount) {
						/* If we don't have a number for this citation and */
						/* the current node doesn't have that the right */
						/* nextNumber, then update. */
						didUpdateNode = true;
						newAttrs.count = nextCount;
					}
					if (!existingCount) {
						counts[key] = {
							count: nextCount,
						};
					}

					const activeCount = existingCount || nextCount;
					if (citationInlineStyle === 'count' && node.attrs.label) {
						/* If we're in count mode, and a label is set, clear it */
						didUpdateNode = true;
						newAttrs.label = '';
					}
					const nextInlineVal = citationsRef.current[activeCount - 1]
						? citationsRef.current[activeCount - 1].inline[citationInlineStyle] || ''
						: '';
					if (
						citationInlineStyle !== 'count' &&
						citationsRef.current[activeCount - 1] &&
						node.attrs.label !== nextInlineVal
					) {
						/* If we're not in count mode, and the label is not */
						/* up to date, refresh it. */
						didUpdateNode = true;
						newAttrs.label = nextInlineVal;
					}
					if (didUpdateNode) {
						didUpdate = true;
						newTransaction.setNodeMarkup(nodePos, null, newAttrs);
					}
				}
				return true;
			});
			if (didUpdate && newTransaction.doc.selection) {
				/* Numbers being updated when html changes causes the node to lose focus. */
				/* This refocuses the node */
				newTransaction.setSelection(newTransaction.doc.selection);
			}
			return didUpdate ? newTransaction : null;
		},
	});
};
