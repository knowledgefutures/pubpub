import { Schema, Node } from 'prosemirror-model';
import { Step } from 'prosemirror-transform';

import { applyStepsToDoc, getFirebaseDoc, getStepsInChangeRange } from '../../utils';

import { mapDiscussionThroughSteps, flattenOnce } from './util';
import { DiscussionInfo, Discussions, NullableDiscussions } from './types';

type Reference = firebase.database.Reference;

const getFastForwardedDiscussion = (
	discussion: DiscussionInfo,
	changesOfSteps: Step[][],
	startingDoc: Node,
	latestDoc: Node,
	startingKey: number,
	latestKey: number,
): DiscussionInfo => {
	const { currentKey } = discussion;
	const currentKeyIndexInChanges = currentKey - startingKey;
	const stepsToRecoverDocAtCurrentKey = flattenOnce(
		changesOfSteps.slice(0, currentKeyIndexInChanges),
	);
	const stepsToApply = flattenOnce(changesOfSteps.slice(currentKeyIndexInChanges));
	const docAtCurrentKey = applyStepsToDoc(stepsToRecoverDocAtCurrentKey, startingDoc);
	const mappedDiscussion = mapDiscussionThroughSteps(
		discussion,
		docAtCurrentKey,
		latestDoc,
		stepsToApply,
	);
	return {
		...mappedDiscussion,
		currentKey: latestKey,
	};
};

export const createFastForwarder = (draftRef: Reference) => async <S extends Schema>(
	discussionsById: NullableDiscussions,
	latestDoc: Node<S>,
	latestHistoryKey: number,
): Promise<Discussions> => {
	const { schema } = latestDoc.type;
	const discussions = Object.values(discussionsById);
	const outdatedDiscussions = discussions.filter((d) => d && d.currentKey < latestHistoryKey);

	if (outdatedDiscussions.length === 0) {
		return {};
	}

	const mostOutdatedKey = outdatedDiscussions.reduce(
		(key, discussion) => (discussion?.selection ? Math.min(key, discussion.currentKey) : key),
		Infinity,
	);

	const [{ doc }, stepsByChangeInRange] = await Promise.all([
		getFirebaseDoc(draftRef, schema, mostOutdatedKey),
		getStepsInChangeRange(draftRef, schema, mostOutdatedKey + 1, latestHistoryKey),
	]);

	const resultingDiscussions: Discussions = {};
	Object.entries(discussionsById).forEach(([discussionId, discussion]) => {
		if (discussion && outdatedDiscussions.includes(discussion)) {
			resultingDiscussions[discussionId] = getFastForwardedDiscussion(
				discussion,
				stepsByChangeInRange,
				doc,
				latestDoc,
				mostOutdatedKey,
				latestHistoryKey,
			);
		}
	});

	return resultingDiscussions;
};
