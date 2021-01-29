import { Node } from 'prosemirror-model';
import { EditorState, Transaction } from 'prosemirror-state';
import { Mapping, Step } from 'prosemirror-transform';

import { createHistoryState } from './historyState';
import { mapDiscussionThroughSteps, removeDiscussionsById } from './util';
import {
	Discussions,
	DiscussionSelection,
	NullableDiscussions,
	DiscussionsUpdateResult,
	RemoteDiscussions,
	DiscussionsFastForwardFn,
} from './types';

type Options = {
	initialDiscussions: Discussions;
	initialDoc: Node;
	initialHistoryKey: number;
	fastForwardDiscussions: null | DiscussionsFastForwardFn;
	remoteDiscussions: null | RemoteDiscussions;
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

const filterDiscussionsUpdate = (discussions: Discussions, update: NullableDiscussions) => {
	const sendableDiscussions: Discussions = {};
	const updatableDiscussions: Discussions = {};
	const removedDiscussionIds: Set<string> = new Set();
	const addedDiscussionIds: Set<string> = new Set();
	Object.entries(update).forEach(([id, next]) => {
		if (next) {
			const previous = discussions[id];
			const hasKeyAdvanced = !previous || previous.currentKey < next.currentKey;
			const isKeyMonotonic = !previous || previous.currentKey <= next.currentKey;
			if (hasKeyAdvanced) {
				sendableDiscussions[id] = next;
			}
			if (isKeyMonotonic) {
				updatableDiscussions[id] = next;
			}
			if (!previous) {
				addedDiscussionIds.add(id);
			}
		} else {
			removedDiscussionIds.add(id);
		}
	});
	return {
		addedDiscussionIds: addedDiscussionIds,
		removedDiscussionIds: removedDiscussionIds,
		sendableDiscussions: sendableDiscussions,
		updatableDiscussions: updatableDiscussions,
	};
};

const getHighestCurrentKeyFromDiscussions = (discussions: NullableDiscussions) => {
	return Object.values(discussions).reduce((max, discussion) => {
		if (discussion) {
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
		remoteDiscussions,
	} = options;
	const history = createHistoryState(initialDoc, initialHistoryKey);
	let discussions = initialDiscussions;

	const updateDiscussions = (update: NullableDiscussions) => {
		const {
			sendableDiscussions,
			updatableDiscussions,
			removedDiscussionIds,
			addedDiscussionIds,
		} = filterDiscussionsUpdate(discussions, update);

		remoteDiscussions?.sendDiscussions(sendableDiscussions);
		discussions = removeDiscussionsById(
			{ ...discussions, ...updatableDiscussions },
			removedDiscussionIds,
		);

		return {
			discussions: discussions,
			addedDiscussionIds: addedDiscussionIds,
			removedDiscussionIds: removedDiscussionIds,
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
				...updateDiscussions(nextDiscussions),
				mapping: tr.mapping,
				doc: currentDoc,
			};
		}

		return null;
	};

	const addDiscussion = (discussionId: string, selection: DiscussionSelection) => {
		const { currentHistoryKey } = history.getState();
		updateDiscussions({
			[discussionId]: {
				initKey: currentHistoryKey,
				currentKey: currentHistoryKey,
				selection: selection,
				initHead: selection.head,
				initAnchor: selection.anchor,
			},
		});
	};

	const asynchronouslyUpdateDiscussions = (update: NullableDiscussions) => {
		if (Object.keys(update).length === 0) {
			return;
		}
		const { addedDiscussionIds, removedDiscussionIds } = updateDiscussions(update);
		const { currentDoc } = history.getState();
		onUpdateDiscussions({
			discussions: discussions,
			addedDiscussionIds: addedDiscussionIds,
			removedDiscussionIds: removedDiscussionIds,
			mapping: new Mapping(),
			doc: currentDoc,
		});
	};

	remoteDiscussions?.receiveDiscussions((update: NullableDiscussions) => {
		const remoteKey = getHighestCurrentKeyFromDiscussions(update);
		history.onReachesKey(remoteKey, () => {
			const { currentDoc, currentHistoryKey } = history.getState();
			asynchronouslyUpdateDiscussions(update);
			fastForwardDiscussions?.(update, currentDoc, currentHistoryKey).then(
				asynchronouslyUpdateDiscussions,
			);
		});
	});

	return {
		addDiscussion: addDiscussion,
		handleTransaction: handleTransaction,
	};
};
