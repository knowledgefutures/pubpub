import { Transaction } from 'prosemirror-state';

import { SuggestedEditsPluginState, SuggestedEditsTransactionContext } from './types';

export const createSuggestedEditsTransactionContext = (
	pluginState: SuggestedEditsPluginState,
	existingTransactions: readonly Transaction[],
	newTransaction: Transaction,
): SuggestedEditsTransactionContext => {
	const { suggestionUserId, suggestionMark } = pluginState;
	return {
		suggestionMark,
		existingTransactions,
		newTransaction,
		transactionAttrs: {
			suggestionUserId,
			suggestionTimestamp: Date.now(),
		},
	};
};
