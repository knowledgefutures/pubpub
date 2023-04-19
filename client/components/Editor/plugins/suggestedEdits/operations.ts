import { Node, Mark, Schema, Attrs, MarkType } from 'prosemirror-model';
import uuid from 'uuid/v4';

import { withValue } from 'utils/fp';

import { suggestionNodeAttributes } from './schema';
import {
	SuggestedEditsTransactionContext,
	SuggestionAttrsPerTransaction,
	SuggestionBaseAttrs,
	SuggestionKind,
	SuggestionMarkAttrs,
	SuggestionNodeAttrs,
	SuggestionUniqueAttrs,
} from './types';

const createSuggestionUniqueAttrs = (): SuggestionUniqueAttrs => {
	return {
		suggestionId: uuid(),
	};
};

const findJoinableSuggestionMarkForRange = (
	suggestionKind: SuggestionKind,
	context: SuggestedEditsTransactionContext,
	from: number,
	to: number,
	withinMinutes: number = 60,
) => {
	const {
		suggestionMark,
		transactionAttrs: { suggestionTimestamp, suggestionUserId },
		newTransaction: { doc },
	} = context;
	const pos = suggestionKind === 'addition' ? from : to;
	const { nodeBefore, nodeAfter } = doc.resolve(pos);
	const resolvedNode = suggestionKind === 'addition' ? nodeBefore : nodeAfter;
	const matchingMark = resolvedNode?.marks?.find((mark) => {
		return (
			mark.type === suggestionMark &&
			mark.attrs.suggestionKind === suggestionKind &&
			// eslint-disable-next-line eqeqeq
			mark.attrs.suggestionUserId == suggestionUserId &&
			suggestionTimestamp - mark.attrs.suggestionTimestamp < 1000 * 60 * withinMinutes
		);
	});
	return matchingMark ?? null;
};

export const getSuggestionMarkTypeFromSchema = (schema: Schema) => {
	return schema.marks.suggestion;
};

export const getSuggestionAttrsForNode = (node: Node): null | SuggestionBaseAttrs => {
	const {
		type: { schema },
	} = node;
	if (node.attrs.suggestionKind) {
		return node.attrs as SuggestionBaseAttrs;
	}
	const suggestionMarkType = getSuggestionMarkTypeFromSchema(schema);
	const suggestionMark = node.marks.find((mark) => mark.type === suggestionMarkType);
	if (suggestionMark) {
		return suggestionMark.attrs as SuggestionBaseAttrs;
	}
	return null;
};

export const getSuggestionKindForNode = (node: Node): null | SuggestionKind => {
	const suggestionAttrs = getSuggestionAttrsForNode(node);
	return suggestionAttrs?.suggestionKind ?? null;
};

export const nodeHasSuggestionKind = (node: Node, kind: SuggestionKind) => {
	const {
		type: { schema },
	} = node;
	if (node.attrs.suggestionKind === kind) {
		return true;
	}
	const suggestionMark = getSuggestionMarkTypeFromSchema(schema);
	return node.marks.some(
		(mark) => mark.type === suggestionMark && mark.attrs.suggestionKind === kind,
	);
};

export const createSuggestionMark = (
	suggestionKind: SuggestionKind,
	suggestionMark: MarkType,
	transactionAttrs: SuggestionAttrsPerTransaction,
	suggestionOriginalMarks?: readonly Mark[],
) => {
	const originalMarksAttrs = withValue(suggestionOriginalMarks, (marks) => {
		if (marks) {
			const asJson = marks.map((mark) => mark.toJSON());
			return { suggestionOriginalMarks: JSON.stringify(asJson) };
		}
		return {};
	});
	const markAttrs: SuggestionMarkAttrs = {
		...createSuggestionUniqueAttrs(),
		...transactionAttrs,
		...originalMarksAttrs,
		suggestionKind,
		suggestionDiscussionId: null,
	};
	return suggestionMark.create(markAttrs);
};

export const addSuggestionToRange = (
	suggestionKind: SuggestionKind,
	context: SuggestedEditsTransactionContext,
	from: number,
	to: number,
) => {
	const { newTransaction, transactionAttrs, suggestionMark } = context;
	const mark =
		findJoinableSuggestionMarkForRange(suggestionKind, context, from, to) ||
		createSuggestionMark(suggestionKind, suggestionMark, transactionAttrs);
	newTransaction.addMark(from, to, mark);
};

export const addSuggestionToNode = (
	suggestionKind: SuggestionKind,
	context: SuggestedEditsTransactionContext,
	pos: number,
	currentNode: Node,
	suggestionOriginalAttrs?: Attrs,
) => {
	const { newTransaction, transactionAttrs } = context;
	const originalAttrsPart = withValue(suggestionOriginalAttrs, (attrs) => {
		if (attrs && suggestionKind === 'modification') {
			const filteredAttrs: Record<string, any> = {};
			Object.keys(attrs).forEach((attrKey) => {
				if (!suggestionNodeAttributes.includes(attrKey)) {
					filteredAttrs[attrKey] = attrs[attrKey];
				}
			});
			return { suggestionOriginalAttrs: JSON.stringify(filteredAttrs) };
		}
		return null;
	});
	const allSuggestionAttrs: SuggestionNodeAttrs = {
		...createSuggestionUniqueAttrs(),
		...transactionAttrs,
		...originalAttrsPart,
		suggestionKind,
		suggestionDiscussionId: null,
	};
	newTransaction.setNodeMarkup(
		pos,
		null,
		{ ...currentNode.attrs, ...allSuggestionAttrs },
		currentNode.marks,
	);
};
