import { Mapping, Step } from 'prosemirror-transform';

import { Discussions, DiscussionInfo, DiscussionSelection, Range } from './types';

export const isEmptySelection = (selection: null | DiscussionSelection) => {
	if (selection) {
		return selection.anchor === selection.head;
	}
	return true;
};

export const getRangeFromSelection = (selection: DiscussionSelection): Range => {
	const { anchor, head } = selection;
	const from = Math.min(anchor, head);
	const to = Math.max(anchor, head);
	return { from: from, to: to };
};

export const getSelectionFromRange = (range: Range): DiscussionSelection => {
	const { from, to } = range;
	return {
		type: 'text',
		anchor: from,
		head: to,
	};
};

export const mapDiscussionSelectionThroughSteps = (
	selection: null | DiscussionSelection,
	steps: Step[],
) => {
	if (isEmptySelection(selection)) {
		return null;
	}
	const mapping = new Mapping(steps.map((step) => step.getMap()));
	const { from, to } = getRangeFromSelection(selection!);
	// This matches the default mapping of inline Decorations, which we wish to emulate here.
	// The default Selection mapping behavior is too greedy; for instance, if a selection is made
	// at the beginning of the document, any text inserted before that selection is also mapped
	// into that selection, which is not what we want for anchored Discussions.
	// See: https://github.com/ProseMirror/prosemirror-view/blob/49889c576bc450a3008117249f9ef9beb6bf2969/src/decoration.js#L36
	const nextFrom = mapping.map(from, 1);
	const nextTo = mapping.map(to, -1);
	if (nextFrom === nextTo) {
		return null;
	}
	return getSelectionFromRange({ from: nextFrom, to: nextTo });
};

export const mapDiscussionThroughSteps = (
	discussion: DiscussionInfo,
	steps: Step[],
): DiscussionInfo => {
	if (!steps.length) {
		return discussion;
	}
	return {
		...discussion,
		selection: mapDiscussionSelectionThroughSteps(discussion.selection, steps),
	};
};

export const removeDiscussionsById = (discussions: Discussions, keys: Set<string>) => {
	if (keys.size === 0) {
		return discussions;
	}
	const nextDiscussions: Discussions = {};
	Object.entries(discussions).forEach(([id, discussion]) => {
		if (!keys.has(id)) {
			nextDiscussions[id] = discussion;
		}
	});
	return nextDiscussions;
};

export const flattenOnce = <T>(arr: T[][]): T[] => arr.reduce((a, b) => [...a, ...b], []);
