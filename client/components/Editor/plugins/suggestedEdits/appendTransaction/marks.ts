import { Fragment, Mark, Node, Slice } from 'prosemirror-model';
import { AddMarkStep, RemoveMarkStep } from 'prosemirror-transform';

import { SuggestedEditsTransactionContext } from '../types';
import { createSuggestionMark, getSuggestionKindForNode } from '../operations';

const createGetOriginalMarksForStep = (step: AddMarkStep | RemoveMarkStep) => {
	const { mark: changedMark } = step;
	// Compute a list of "original marks" for this node before `step` was applied
	return (node: Node): readonly Mark[] => {
		const { marks } = node;
		// If we removed a mark this step...
		if (step instanceof RemoveMarkStep) {
			if (!changedMark.isInSet(marks)) {
				// We want to add it back to the list of original marks
				return changedMark.addToSet(marks);
			}
			// That is, unless, it was already there.
			return marks;
		}
		// If we added a mark this step, we want to remove it from the list of original marks
		return changedMark.removeFromSet(marks);
	};
};

type GetOriginalMarks = ReturnType<typeof createGetOriginalMarksForStep>;

const maybeApplyModifiedMarkToNode = (
	node: Node,
	getOriginalMarks: GetOriginalMarks,
	context: SuggestedEditsTransactionContext,
) => {
	const { transactionAttrs, suggestionMark } = context;
	if (!getSuggestionKindForNode(node)) {
		const originalMarks = getOriginalMarks(node);
		const newMark = createSuggestionMark(
			'modification',
			suggestionMark,
			transactionAttrs,
			originalMarks,
		);
		return node.mark([...node.marks, newMark]);
	}
	return node;
};

const getMarkedModifiedFragment = (
	fragment: Fragment,
	getOriginalMarks: GetOriginalMarks,
	context: SuggestedEditsTransactionContext,
) => {
	const children: Node[] = [];
	for (let i = 0; i < fragment.childCount; i++) {
		const child = fragment.child(i);
		const newChildFragment = getMarkedModifiedFragment(
			child.content,
			getOriginalMarks,
			context,
		);
		const newChild = child.copy(newChildFragment);
		children.push(maybeApplyModifiedMarkToNode(newChild, getOriginalMarks, context));
	}
	return Fragment.from(children);
};

const getMarkedModifiedSlice = (
	slice: Slice,
	getOriginalMarks: GetOriginalMarks,
	context: SuggestedEditsTransactionContext,
) => {
	const { content, openStart, openEnd } = slice;
	const markedContent = getMarkedModifiedFragment(content, getOriginalMarks, context);
	return new Slice(markedContent, openStart, openEnd);
};

export const indicateMarkChanges = (context: SuggestedEditsTransactionContext) => {
	const { existingTransactions, newTransaction } = context;
	// Detect marks that have been added to the document (prosemirror-changeset doesn't do this)
	// and apply an additional "yellow" changed mark over these.
	existingTransactions.forEach((txn) => {
		const { steps } = txn;
		steps.forEach((step) => {
			if (step instanceof AddMarkStep || step instanceof RemoveMarkStep) {
				// We may have already modified the document in this transaction,
				// invalidating these positions. So we map them through the transaction.
				const fromInCurrentDoc = newTransaction.mapping.map(step.from);
				const toInCurrentDoc = newTransaction.mapping.map(step.to);
				// This produces a function (node: Node) => Marks[] that tells us what marks
				// were on a given node before this step was applied.
				const getOriginalMarks = createGetOriginalMarksForStep(step);
				// Grab the slice of the doc that was marked by this step...
				const markedSlice = newTransaction.doc.slice(fromInCurrentDoc, toInCurrentDoc);
				// And add a "yellow" modified mark to the regions of the slice that don't already
				// have a Suggested Edits mark (i.e. don't add yellow over green).
				const markedModifiedSlice = getMarkedModifiedSlice(
					markedSlice,
					getOriginalMarks,
					context,
				);
				// Now replace the Slice that was marked in this step with a slice that should
				// be identical, except that all or part of it may be "yellow" to indicate that
				// the changed marks in this Slice are a suggestion.
				newTransaction.replace(fromInCurrentDoc, toInCurrentDoc, markedModifiedSlice);
			}
		});
	});
};
