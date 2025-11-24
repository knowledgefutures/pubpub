import type { Node } from 'prosemirror-model';
import type { EditorState, Transaction } from 'prosemirror-state';

import { findParentNodeClosestToPos } from 'client/components/Editor/utils';

import { idsPluginKey } from '../../ids';
import { createSuggestedEditsTransactionContext } from '../context';
import { suggestedEditsPluginKey } from '../key';
import { getSuggestedEditsState } from '../state';
import { indicateAttributeChanges } from './attributes';
import { indicateMarkChanges } from './marks';
import { mapSelectionThroughTransaction } from './selection';
import { indicateTextAndStructureChanges } from './textAndStructure';

// TODO: we should be using the history and collab plugin PluginKeys here
const excludedMeta = [
	'history$',
	'collab$',
	idsPluginKey,
	suggestedEditsPluginKey,
	'appendedTransaction',
];

const nodeIsMath = (node: Node) => ['math_inline', 'math_display'].includes(node.type.name);

const isMathTransaction = (tr: Transaction) => {
	// `any` is used here because the Step type doesn't include `from` or `pos` properties, but all step
	// types include at least one of those
	return tr.steps.some((step: any) => {
		const pos = step.from ?? step.pos;
		const resolvedPos = tr.doc.resolve(pos);
		return findParentNodeClosestToPos(resolvedPos, nodeIsMath);
	});
};

const shouldExamineTransaction = (tr: Transaction) => {
	return (
		tr.docChanged && !excludedMeta.some((meta) => !!tr.getMeta(meta)) && !isMathTransaction(tr)
	);
};

export const appendTransaction = (
	transactions: readonly Transaction[],
	_: EditorState,
	newState: EditorState,
) => {
	const pluginState = getSuggestedEditsState(newState)!;
	if (pluginState.isEnabled) {
		const transactionsToExamine = transactions.filter(shouldExamineTransaction);
		if (transactionsToExamine.length > 0) {
			const { tr: newTransaction } = newState;
			const context = createSuggestedEditsTransactionContext(
				pluginState,
				transactions,
				newTransaction,
			);
			indicateTextAndStructureChanges(context);
			indicateMarkChanges(context);
			indicateAttributeChanges(context);
			mapSelectionThroughTransaction(newTransaction, newState.selection);
			return newTransaction;
		}
	}
	return null;
};
