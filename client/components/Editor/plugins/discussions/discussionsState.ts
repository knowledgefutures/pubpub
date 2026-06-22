import type { Node } from 'prosemirror-model';
import type { EditorState, Transaction } from 'prosemirror-state';

import type {
	DiscussionInfo,
	DiscussionSelection,
	Discussions,
	DiscussionsFastForwardFn,
	DiscussionsUpdateResult,
	NullableDiscussions,
	RemoteDiscussions,
} from './types';

import { Mapping, type Step } from 'prosemirror-transform';

import { createHistoryState } from './historyState';
import { mapDiscussionThroughSteps, removeDiscussionsById } from './util';

type Options = {
	initialDiscussions: Discussions;
	initialDoc: Node;
	initialHistoryKey: number;
	fastForwardDiscussions: null | DiscussionsFastForwardFn;
	remoteDiscussions: null | RemoteDiscussions;
	onNewDiscussionIds?: (ids: string[]) => void;
	onUpdateDiscussions: (result: DiscussionsUpdateResult) => unknown;
};

const getUpdatedDiscussionsForTransaction = (
	discussions: Discussions,
	steps: Step[],
	previousHistoryKey: number,
	nextHistoryKey: number,
): Discussions => {
	if (previousHistoryKey === nextHistoryKey && steps.length === 0) {
		return {};
	}
	const resultingDiscussions: Discussions = {};
	Object.keys(discussions).forEach((id) => {
		const discussion = discussions[id];
		if (discussion.currentKey === previousHistoryKey) {
			const mappedDiscussion = mapDiscussionThroughSteps(discussion, steps);
			resultingDiscussions[id] = {
				...mappedDiscussion,
				currentKey: nextHistoryKey,
			};
		}
	});
	return resultingDiscussions;
};

const filterDiscussionsUpdate = (
	discussions: Discussions,
	update: NullableDiscussions,
	currentKey: number,
) => {
	const sendableDiscussions: Discussions = {};
	const updatableDiscussions: Discussions = {};
	const removedDiscussionIds: Set<string> = new Set();
	const addedDiscussionIds: Set<string> = new Set();
	Object.entries(update).forEach(([id, next]) => {
		if (next) {
			if (next.currentKey <= currentKey) {
				const adjusted = next.currentKey < currentKey ? { ...next, currentKey } : next;
				const previous = discussions[id];
				const hasKeyAdvanced = !previous || previous.currentKey < adjusted.currentKey;
				const isKeyMonotonic = !previous || previous.currentKey <= adjusted.currentKey;
				if (hasKeyAdvanced) {
					sendableDiscussions[id] = adjusted;
				}
				if (isKeyMonotonic) {
					updatableDiscussions[id] = adjusted;
				}
				if (!previous) {
					addedDiscussionIds.add(id);
				}
			}
		} else {
			removedDiscussionIds.add(id);
		}
	});
	return {
		addedDiscussionIds,
		removedDiscussionIds,
		sendableDiscussions,
		updatableDiscussions,
	};
};

const isValidDiscussionInfo = (d: any): d is DiscussionInfo =>
	d && typeof d.currentKey === 'number' && typeof d.initKey === 'number' && d.selection;

const sanitizeRemoteDiscussions = (raw: NullableDiscussions): NullableDiscussions => {
	const result: NullableDiscussions = {};
	for (const [id, d] of Object.entries(raw)) {
		if (d === null || isValidDiscussionInfo(d)) {
			result[id] = d;
		}
	}
	return result;
};

const getHighestCurrentKeyFromDiscussions = (discussions: NullableDiscussions) => {
	return Object.values(discussions).reduce((max, discussion) => {
		if (discussion && typeof discussion.currentKey === 'number') {
			return Math.max(max, discussion.currentKey);
		}
		return max;
	}, -1);
};

export const createDiscussionsState = (options: Options) => {
	const {
		initialDiscussions,
		initialHistoryKey,
		initialDoc,
		fastForwardDiscussions,
		onUpdateDiscussions,
		onNewDiscussionIds,
		remoteDiscussions,
	} = options;
	const history = createHistoryState(initialDoc, initialHistoryKey);
	let discussions = initialDiscussions;

	const updateDiscussions = (update: NullableDiscussions, currentKey: number) => {
		const {
			sendableDiscussions,
			updatableDiscussions,
			removedDiscussionIds,
			addedDiscussionIds,
		} = filterDiscussionsUpdate(discussions, update, currentKey);

		discussions = removeDiscussionsById(
			{ ...discussions, ...updatableDiscussions },
			removedDiscussionIds,
		);
		remoteDiscussions?.sendDiscussions(sendableDiscussions);

		return {
			discussions,
			addedDiscussionIds,
			removedDiscussionIds,
		};
	};

	const handleTransaction = (
		tr: Transaction,
		nextState: EditorState,
	): null | DiscussionsUpdateResult => {
		const { currentDoc, currentHistoryKey, previousHistoryKey } = history.updateState(
			tr,
			nextState,
		);

		if (tr.steps.length > 0 || currentHistoryKey > previousHistoryKey) {
			const nextDiscussions = getUpdatedDiscussionsForTransaction(
				discussions,
				tr.steps,
				previousHistoryKey,
				currentHistoryKey,
			);
			return {
				...updateDiscussions(nextDiscussions, currentHistoryKey),
				mapping: tr.mapping,
				doc: currentDoc,
			};
		}

		return null;
	};

	const asynchronouslyUpdateDiscussions = (update: NullableDiscussions) => {
		if (Object.keys(update).length === 0) {
			return;
		}
		const { currentDoc, currentHistoryKey } = history.getState();
		const { addedDiscussionIds, removedDiscussionIds } = updateDiscussions(
			update,
			currentHistoryKey,
		);
		onUpdateDiscussions({
			discussions,
			addedDiscussionIds,
			removedDiscussionIds,
			mapping: new Mapping(),
			doc: currentDoc,
		});
	};

	const addDiscussion = (discussionId: string, selection: DiscussionSelection) => {
		const { currentHistoryKey } = history.getState();
		asynchronouslyUpdateDiscussions({
			[discussionId]: {
				initKey: currentHistoryKey,
				currentKey: currentHistoryKey,
				selection,
				initHead: selection.head,
				initAnchor: selection.anchor,
			},
		});
	};

	remoteDiscussions?.receiveDiscussions((rawUpdate: NullableDiscussions) => {
		const update = sanitizeRemoteDiscussions(rawUpdate);
		if (Object.keys(update).length === 0) return;

		const newIds = Object.keys(update).filter((id) => update[id] && !discussions[id]);
		if (newIds.length > 0) {
			onNewDiscussionIds?.(newIds);
		}

		const remoteKey = getHighestCurrentKeyFromDiscussions(update);
		if (remoteKey < 0) return;

		history.onReachesKey(remoteKey, () => {
			const { currentDoc, currentHistoryKey } = history.getState();
			asynchronouslyUpdateDiscussions(update);
			fastForwardDiscussions?.(update, currentDoc, currentHistoryKey).then(
				asynchronouslyUpdateDiscussions,
			);
		});
	});

	return {
		addDiscussion,
		handleTransaction,
	};
};
