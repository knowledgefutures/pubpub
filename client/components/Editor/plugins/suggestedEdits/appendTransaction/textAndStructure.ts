import { Fragment, Node, Slice } from 'prosemirror-model';
import { Change, ChangeSet } from 'prosemirror-changeset';

import { SuggestedEditsTransactionContext, SuggestionKind } from '../types';
import { addSuggestionToNode, addSuggestionToRange, nodeHasSuggestionKind } from '../operations';

const canNodeTypeHaveSimultaneousAdditionAndDeletion = (node: Node) => {
	// TODO: this might be true for table cells that are simultaneously in an added row and
	// a removed column. Might have to play around here.
	void node;
	return false;
};

const shouldIncludeNodeInNetFragment = (node: Node, suggestionKind: SuggestionKind) => {
	if (canNodeTypeHaveSimultaneousAdditionAndDeletion(node)) {
		return true;
	}
	const nodeHasOppositeSuggestion = nodeHasSuggestionKind(
		node,
		suggestionKind === 'removal' ? 'addition' : 'removal',
	);
	// Don't strikethrough nodes that were added by Suggested Edits (or vice versa).
	if (nodeHasOppositeSuggestion) {
		return false;
	}
	return true;
};

const getNetFragment = (fragment: Fragment, suggestionKind: SuggestionKind) => {
	const children: Node[] = [];
	for (let i = 0; i < fragment.childCount; i++) {
		const child = fragment.child(i);
		if (shouldIncludeNodeInNetFragment(child, suggestionKind)) {
			const newChildFramgent = getNetFragment(child.content, suggestionKind);
			const newChild = child.copy(newChildFramgent);
			children.push(newChild);
		}
	}
	return Fragment.from(children);
};

const getNetSlice = (slice: Slice, suggestionKind: SuggestionKind) => {
	const { content, openStart, openEnd } = slice;
	const netContent = getNetFragment(content, suggestionKind);
	return new Slice(netContent, openStart, openEnd);
};

export const indicateTextAndStructureChanges = (context: SuggestedEditsTransactionContext) => {
	const { existingTransactions, newTransaction } = context;
	// prosemirror-changeset will provide a list of Change objects which contain:
	// - a range (fromB, toB) which represents newly-changed content in the document
	// - a corresponding range (fromA, toA) in the old document.
	const changeset = existingTransactions.reduce(
		(set, txn) =>
			set.addSteps(
				txn.doc,
				txn.steps.map((step) => step.getMap()),
				null,
			),
		ChangeSet.create(existingTransactions[0].before),
	);
	// These are in reverse order -- we work from the back of the document so that adding our
	// removal slices doesn't invalidate positions later in the array.
	const orderedChanges = [...changeset.changes].sort((x, y) => y.fromB - x.fromB);
	orderedChanges.forEach((change: Change) => {
		const { fromA: oldStart, toA: oldEnd, fromB: newStart, toB: newEnd } = change;
		const addedSlice = newTransaction.doc.slice(newStart, newEnd);
		const netAdditionSlice = getNetSlice(addedSlice, 'addition');
		let netNewEnd = newEnd;
		// As an optimization, only do the replacement if the slices aren't equal in size
		// NOTE(ian): Sometimes netAdditionSlice.size = -1 which will cause Prosemirror
		// to hang forever trying to place it. In this case we should just bail out.
		if (addedSlice.size !== netAdditionSlice.size && netAdditionSlice.size >= 0) {
			newTransaction.replace(newStart, newEnd, netAdditionSlice);
			netNewEnd = newStart + netAdditionSlice.size;
		}
		if (netAdditionSlice.size > 0) {
			// First mark all inline content in the change range. This will affect things like text,
			// citations, and footnotes that live inside a single paragraph.
			addSuggestionToRange('addition', context, newStart, netNewEnd);
			// Now look at the _nodes_ that were created in that range...
			newTransaction.doc.nodesBetween(newStart, netNewEnd, (node: Node, pos: number) => {
				// If the node's position is in the range, it was just created.
				// If it's a block node, it won't have a mark applied to it.
				// So we add the suggestionKind attribute to it instead.
				if (pos >= newStart && pos <= netNewEnd && node.isBlock) {
					addSuggestionToNode('addition', context, pos, node);
				}
			});
		}
		// This is the content that the change removed from the old doc. It may (trivially) be empty
		const removedSlice = changeset.startDoc.slice(oldStart, oldEnd);
		// Compute a "net removal slice" which we will restore to the document "in red" to suggest
		// that this content be deleted. This removes all the content "in green" in the slice, which
		// was created by Suggested Edits and is therefore safe to outright delete.
		const netRemovalSlice = getNetSlice(removedSlice, 'removal');
		if (netRemovalSlice.size > 0) {
			const removalEnd = newStart + netRemovalSlice.size;
			// Add the net removal slice back in...
			newTransaction.replace(newStart, newStart, netRemovalSlice);
			// Now mark it as a suggested removal...
			if (newStart < removalEnd) {
				addSuggestionToRange('removal', context, newStart, removalEnd);
			}
			// And do the same things to its constituent nodes, as we did above for additions.
			newTransaction.doc.nodesBetween(newStart, removalEnd, (node: Node, pos: number) => {
				if (pos >= newStart && pos <= removalEnd && node.isBlock) {
					addSuggestionToNode('removal', context, pos, node);
				}
			});
		}
	});
};
