import { EditorState, Transaction } from 'prosemirror-state';

import { idsPluginKey } from '../../ids';
import { getSuggestedEditsState } from '../state';
import { indicateAttributeChanges } from './attributes';
import { createSuggestedEditsTransactionContext } from '../context';

import { indicateMarkChanges } from './marks';
import { mapSelectionThroughTransaction } from './selection';
import { indicateTextAndStructureChanges } from './textAndStructure';
import { suggestedEditsPluginKey } from '../key';

// TODO: we should be using the history and collab plugin PluginKeys here
const excludedMeta = [
	'history$',
	'collab$',
	idsPluginKey,
	suggestedEditsPluginKey,
	'appendedTransaction',
];

const shouldExamineTransaction = (tr: Transaction) => {
	return tr.docChanged && !excludedMeta.some((meta) => !!tr.getMeta(meta));
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
