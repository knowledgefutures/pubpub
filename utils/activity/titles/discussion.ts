import type { PubDiscussionCommentAddedActivityItem } from 'types';

import type { TitleRenderer } from '../../../client/utils/activity/types';

import { pubUrl } from 'utils/canonicalUrls';

import { getPubFromContext } from './util';

export const discussionTitle: TitleRenderer<PubDiscussionCommentAddedActivityItem> = (
	item,
	context,
) => {
	const pubFromContext = getPubFromContext(item.pubId, context);
	const community = pubFromContext && context.associations.community[pubFromContext.communityId];
	const title = item.payload.isReply ? 'a reply to a Discussion' : 'a new Discussion';
	const href = pubFromContext
		? pubUrl(community, pubFromContext, { discussionId: item.payload.discussionId })
		: null;

	return { title, href };
};
