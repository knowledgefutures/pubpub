import { Plugin } from 'prosemirror-state';
import { generateHash } from '../utils';

const inPasteRange = (offset, transactions) => {
	return transactions.some((trans) => {
		if (trans.meta.paste) {
			const pasteStart = trans.steps[0].from;
			const pasteEnd = trans.steps[0].from + trans.steps[0].slice.content.size;
			return offset >= pasteStart && offset < pasteEnd;
		}
		return false;
	});
};

const updatedNodeAttrsWithNewRandomId = (node) => {
	return {
		...node.attrs,
		id: generateHash(10),
	};
};

const getIdsTransactionForState = (editorState, transactions = []) => {
	const transaction = editorState.tr;
	let mustReturnTransaction = false;
	const seenIds = new Set();
	const possibleChangesForPastedNodes = {};
	editorState.doc.descendants((node, pos) => {
		const nodeTypeHasId = node.type.spec.attrs && node.type.spec.attrs.id;

		if (node.type.name === 'heading') {
			return;
		}

		if (node.attrs.id) {
			const hasSeenNodeId = seenIds.has(node.attrs.id);
			if (inPasteRange(pos, transactions)) {
				if (hasSeenNodeId) {
					// If it is in the pasted range and we've seen the ID,
					// we need to change the ID of the pasted item.
					mustReturnTransaction = true;
					transaction.setNodeMarkup(
						pos,
						node.type,
						updatedNodeAttrsWithNewRandomId(node),
					);
				} else {
					// If it is in the pasted range, but we haven't seen the ID
					// we need to register the values with pendingNodeChanges in case we do
					// see the hash later on. This will occur if we copy a node and then
					// paste it above the source location.
					possibleChangesForPastedNodes[node.attrs.id] = {
						offset: pos,
						type: node.type,
						attrs: updatedNodeAttrsWithNewRandomId(node),
					};
				}
			} else if (hasSeenNodeId) {
				// If it's not in pasted range and we've seen the ID, that means it's
				// a duplicate from before the time of unique IDs. Change the ID.
				mustReturnTransaction = true;
				transaction.setNodeMarkup(pos, node.type, updatedNodeAttrsWithNewRandomId(node));
			} else {
				seenIds.add(node.attrs.id);
				if (possibleChangesForPastedNodes[node.attrs.id]) {
					const newChange = possibleChangesForPastedNodes[node.attrs.id];
					mustReturnTransaction = true;
					transaction.setNodeMarkup(newChange.offset, newChange.type, newChange.attrs);
				}
			}
		} else if (nodeTypeHasId) {
			// If it doesn't have an ID, assign one as long as its
			// schema supports ID fields.
			mustReturnTransaction = true;
			transaction.setNodeMarkup(pos, node.type, updatedNodeAttrsWithNewRandomId(node));
		}
	});

	return mustReturnTransaction ? transaction : null;
};

export default (_, props) => {
	if (props.isReadOnly) {
		return [];
	}
	return new Plugin({
		view: (editorView) => {
			const transaction = getIdsTransactionForState(editorView.state);
			if (transaction) {
				editorView.dispatch(transaction);
			}
			return {};
		},
		appendTransaction: (transactions, __, newState) =>
			getIdsTransactionForState(newState, transactions),
	});
};
