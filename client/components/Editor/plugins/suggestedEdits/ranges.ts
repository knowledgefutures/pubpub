import { Node, Slice } from 'prosemirror-model';

import { pruneFalsyValues } from 'utils/arrays';

import { getSuggestionAttrsForNode } from './operations';
import {
	BaseSuggestionRange,
	ReplacementSuggestionRange,
	SuggestionBaseAttrs,
	SuggestionKind,
	SuggestionRange,
} from './types';

type RawSuggestionRange = {
	suggestionKind: null | SuggestionKind;
	suggestionAttrs: SuggestionBaseAttrs[];
	from: number;
	to: number;
};

type SimpleSuggestionRange = Exclude<SuggestionRange, ReplacementSuggestionRange>;

const getRawSuggestionRanges = (doc: Node, from: number = 0, to: number = doc.nodeSize - 2) => {
	const ranges: RawSuggestionRange[] = [];
	doc.nodesBetween(from, to, (node: Node, pos: number) => {
		const suggestionAttrs = getSuggestionAttrsForNode(node);
		ranges.push({
			suggestionKind: suggestionAttrs?.suggestionKind ?? null,
			suggestionAttrs: suggestionAttrs ? [suggestionAttrs] : [],
			from: pos,
			to: pos + (node.isLeaf ? node.nodeSize : 1),
		});
	});
	return ranges.reduce((current: RawSuggestionRange[], next: RawSuggestionRange) => {
		const previous = current.pop();
		if (previous) {
			if (previous.suggestionKind === next.suggestionKind && previous.to === next.from) {
				const joined: RawSuggestionRange = {
					suggestionKind: previous.suggestionKind,
					from: previous.from,
					to: next.to,
					suggestionAttrs: [...previous.suggestionAttrs, ...next.suggestionAttrs],
				};
				return [...current, joined];
			}
			return [...current, previous, next];
		}
		return [next];
	}, [] as RawSuggestionRange[]);
};

const createSuggestionRange = (
	rawRange: RawSuggestionRange,
	doc: Node,
): null | SimpleSuggestionRange => {
	const { suggestionKind, from, to, suggestionAttrs } = rawRange;
	if (suggestionKind === null) {
		return null;
	}
	const base: BaseSuggestionRange = {
		from,
		to,
		suggestionAttrs: suggestionAttrs[0],
	};
	if (suggestionKind === 'addition') {
		return { ...base, kind: 'addition', slice: doc.slice(from, to) };
	}
	if (suggestionKind === 'modification') {
		return { ...base, kind: 'modification', slice: doc.slice(from, to) };
	}
	return { ...base, kind: 'removal', slice: doc.slice(from, to) };
};

const maybeCreateReplacementRange = (
	previous: SuggestionRange,
	next: SimpleSuggestionRange,
): null | ReplacementSuggestionRange => {
	const { suggestionAttrs } = previous;
	if (previous.to === next.from) {
		const proposed = {
			kind: 'replacement' as const,
			from: previous.from,
			to: next.to,
			suggestionAttrs,
		};
		if (previous.kind === 'addition' && next.kind === 'removal') {
			return {
				...proposed,
				slices: [previous.slice, next.slice],
				order: 'addition-removal',
			};
		}
		if (previous.kind === 'removal' && next.kind === 'addition') {
			return {
				...proposed,
				slices: [previous.slice, next.slice],
				order: 'removal-addition',
			};
		}
		if (previous.kind === 'replacement') {
			if (
				(next.kind === 'removal' && previous.order === 'addition-removal') ||
				(next.kind === 'addition' && previous.order === 'removal-addition')
			) {
				const {
					order,
					slices: [first, second],
				} = previous;
				return {
					...proposed,
					order,
					slices: [
						first,
						new Slice(
							second.content.append(next.slice.content),
							second.openStart,
							next.slice.openEnd,
						),
					],
				};
			}
		}
	}
	return null;
};

export const getSuggestionRanges = (doc: Node, from: number = 0, to: number = doc.nodeSize - 2) => {
	const rawRanges = getRawSuggestionRanges(doc, from, to);
	const simpleRanges = pruneFalsyValues(
		rawRanges.map((range) => createSuggestionRange(range, doc)),
	);
	return simpleRanges.reduce((acc: SuggestionRange[], next: SimpleSuggestionRange) => {
		const previous = acc.pop();
		if (previous) {
			const replacementRange = maybeCreateReplacementRange(previous, next);
			if (replacementRange) {
				return [...acc, replacementRange];
			}
			return [...acc, previous, next];
		}
		return [next];
	}, [] as SuggestionRange[]);
};
