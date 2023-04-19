import { MarkType, Slice } from 'prosemirror-model';
import { Transaction } from 'prosemirror-state';

import { suggestionNodeAttributes } from './schema';

export type SuggestionKind = 'addition' | 'modification' | 'removal';

export type SuggestionNodeAttribute = keyof typeof suggestionNodeAttributes;

export type SuggestionUniqueAttrs = {
	suggestionId: string;
};

export type SuggestionAttrsPerTransaction = {
	suggestionUserId: string;
	suggestionTimestamp: number;
};

export type SuggestionBaseAttrs = SuggestionUniqueAttrs &
	SuggestionAttrsPerTransaction & {
		suggestionDiscussionId: null | string;
		suggestionKind: SuggestionKind;
	};

export type SuggestionMarkAttrs = SuggestionBaseAttrs & {
	suggestionOriginalMarks?: null | string;
};

export type SuggestionNodeAttrs = SuggestionBaseAttrs & {
	suggestionOriginalAttrs?: null | string;
};

export type SuggestedEditsPluginState = {
	isEnabled: boolean;
	suggestionUserId: string;
	suggestionMark: MarkType;
	suggestionRanges: SuggestionRange[];
	hasComputedSuggestionRanges: boolean;
};

export type SuggestedEditsTransactionContext = {
	existingTransactions: readonly Transaction[];
	newTransaction: Transaction;
	transactionAttrs: SuggestionAttrsPerTransaction;
	suggestionMark: MarkType;
};

export type BaseSuggestionRange = {
	suggestionAttrs: SuggestionBaseAttrs;
	from: number;
	to: number;
};

export type AdditionSuggestionRange = BaseSuggestionRange & {
	kind: 'addition';
	slice: Slice;
};

export type RemovalSuggestionRange = BaseSuggestionRange & {
	kind: 'removal';
	slice: Slice;
};

export type ReplacementSuggestionRange = BaseSuggestionRange & {
	kind: 'replacement';
	order: 'removal-addition' | 'addition-removal';
	slices: [Slice, Slice];
};

export type ModificationSuggestionRange = BaseSuggestionRange & {
	kind: 'modification';
	slice: Slice;
};

export type SuggestionRange =
	| AdditionSuggestionRange
	| RemovalSuggestionRange
	| ReplacementSuggestionRange
	| ModificationSuggestionRange;
