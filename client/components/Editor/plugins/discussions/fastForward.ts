import { Node } from 'prosemirror-model';
import { Step } from 'prosemirror-transform';
import firebase from 'firebase';

import { flattenOnce } from 'utils/arrays';
import { getStepsInChangeRange } from '../../utils';

import { mapDiscussionThroughSteps } from './util';
import { DiscussionInfo, Discussions, NullableDiscussions } from './types';

type Reference = firebase.database.Reference;

const getFastForwardedDiscussion = (
	discussion: DiscussionInfo,
	changesOfSteps: Step[][],
	startingKey: number,
	latestKey: number,
): DiscussionInfo => {
	const { currentKey } = discussion;
	const currentKeyIndexInChanges = currentKey - startingKey;
	const stepsToApply = flattenOnce(changesOfSteps.slice(currentKeyIndexInChanges));
	const mappedDiscussion = mapDiscussionThroughSteps(discussion, stepsToApply);
	return {
		...mappedDiscussion,
		currentKey: latestKey,
	};
};

export const createFastForwarder =
	(draftRef: Reference) =>
	async (
		discussionsById: NullableDiscussions,
		latestDoc: Node,
		latestHistoryKey: number,
	): Promise<Discussions> => {
		const { schema } = latestDoc.type;
		const discussions = Object.values(discussionsById);
		const outdatedDiscussions = discussions.filter((d) => d && d.currentKey < latestHistoryKey);

		if (outdatedDiscussions.length === 0) {
			return {};
		}

		const mostOutdatedKey = outdatedDiscussions.reduce(
			(key, discussion) =>
				discussion?.selection ? Math.min(key, discussion.currentKey) : key,
			Infinity,
		);

		const stepsByChangeInRange = await getStepsInChangeRange(
			draftRef,
			schema,
			mostOutdatedKey + 1,
			latestHistoryKey,
		);

		const resultingDiscussions: Discussions = {};
		Object.entries(discussionsById).forEach(([discussionId, discussion]) => {
			if (discussion && outdatedDiscussions.includes(discussion)) {
				resultingDiscussions[discussionId] = getFastForwardedDiscussion(
					discussion,
					stepsByChangeInRange,
					mostOutdatedKey,
					latestHistoryKey,
				);
			}
		});

		return resultingDiscussions;
	};
