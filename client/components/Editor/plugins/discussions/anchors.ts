import { DiscussionAnchor } from 'utils/types';

import { Discussions } from './types';
import { isEmptySelection } from './util';

export const getDiscussionsFromAnchors = (anchors: DiscussionAnchor[]): Discussions => {
	const discussions: Discussions = {};
	anchors.forEach((anchor) => {
		const { selection, discussionId, historyKey } = anchor;
		if (selection && !isEmptySelection(selection)) {
			discussions[discussionId] = {
				initKey: historyKey,
				currentKey: historyKey,
				initAnchor: selection.anchor,
				initHead: selection.head,
				selection: selection,
			};
		}
	});
	return discussions;
};
