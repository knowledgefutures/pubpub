import { Node } from 'prosemirror-model';
import { AttrStep, ReplaceAroundStep, ReplaceStep, Step } from 'prosemirror-transform';

import { SuggestedEditsTransactionContext } from '../types';
import { addSuggestionToNode, getSuggestionKindForNode } from '../operations';

const getModifiedNodeInfo = (
	step: Step,
	docBeforeStep: Node,
): null | { pos: number; nodeBeforeStep: Node } => {
	// In practice, there are a few different ways Prosemirror will set a node's attributes.
	// This function tries to abstract over these to provide information about which node
	// was changed by an arbitrary step.
	if (step instanceof AttrStep) {
		// It might do it with an AttrStep, which is the most straightforward but not commonly seen
		const { pos } = step;
		const nodeBeforeStep = docBeforeStep.nodeAt(pos);
		if (nodeBeforeStep) {
			return { pos, nodeBeforeStep };
		}
	}
	if (step instanceof ReplaceStep) {
		// For leaf nodes, it's more likely to do it with a ReplaceStep that replaces a range like
		// (n, n+1) with an identical node, only with new attrs. Detect this.
		const {
			from,
			to,
			slice: { content },
		} = step;
		const nodeBeforeStep = docBeforeStep.nodeAt(from);
		const firstAndOnlyNodeInContent = content.childCount === 1 ? content.child(0) : null;
		// Try to detect this case: the replacement should be over a size-1 range and should
		// contain a node identical to what was there before.
		if (
			to === from + 1 &&
			nodeBeforeStep &&
			firstAndOnlyNodeInContent &&
			nodeBeforeStep.type === firstAndOnlyNodeInContent.type
		) {
			return { pos: from, nodeBeforeStep };
		}
	}
	if (step instanceof ReplaceAroundStep) {
		// For non-leaf nodes with attrs (like headings), it will use a ReplaceAroundStep to
		// accomplish the same thing.
		const { from, gapFrom, to, gapTo } = step;
		const nodeBeforeStep = docBeforeStep.nodeAt(from);
		if (nodeBeforeStep) {
			// The tell is that the "gap" that the step keeps is the entirety of the node content
			if (gapFrom === from + 1 && gapTo === to - 1) {
				return { pos: from, nodeBeforeStep };
			}
		}
	}
	return null;
};

export const indicateAttributeChanges = (context: SuggestedEditsTransactionContext) => {
	const { existingTransactions, newTransaction } = context;
	// Look for nodes whose attributes were changed in this transaction and mark them with a
	// "yellow" modified suggestionKind attribute -- assuming they're not already in a suggestion.
	existingTransactions.forEach((txn) => {
		const { steps } = txn;
		steps.forEach((step, index) => {
			const docBeforeStep = txn.docs[index];
			const modifiedNodeInfo = getModifiedNodeInfo(step, docBeforeStep);
			if (modifiedNodeInfo) {
				const { nodeBeforeStep, pos } = modifiedNodeInfo;
				const posInCurrentDoc = newTransaction.mapping.map(pos);
				const nodeInCurrentDoc = newTransaction.doc.nodeAt(posInCurrentDoc);
				if (nodeInCurrentDoc && !getSuggestionKindForNode(nodeInCurrentDoc)) {
					addSuggestionToNode(
						'modification',
						context,
						posInCurrentDoc,
						nodeInCurrentDoc,
						nodeBeforeStep.attrs,
					);
				}
			}
		});
	});
};
