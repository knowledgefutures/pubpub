import {
	CommunityCreatedActivityItem,
	CommunityUpdatedActivityItem,
	FacetsActivityItem,
	MemberActivityItem,
} from 'types';
import { communityUrl } from 'utils/canonicalUrls';

import { TitleRenderer } from '../types';
import { getCommunityFromContext } from './util';

type AcceptedItem =
	| CommunityCreatedActivityItem
	| CommunityUpdatedActivityItem
	| MemberActivityItem
	| FacetsActivityItem;

const prefix = 'the Community';

export const communityTitle: TitleRenderer<AcceptedItem> = (item, context) => {
	const isInCommunityScope =
		!('pubId' in context.scope) &&
		!('collectionId' in context.scope) &&
		context.scope.communityId === item.communityId;

	if (isInCommunityScope) {
		return {
			title: 'this Community',
		};
	}

	const communityFromContext = getCommunityFromContext(item.communityId, context);
	if (communityFromContext) {
		return {
			prefix,
			title: communityFromContext.title,
			href: communityUrl(communityFromContext),
		};
	}

	if ('community' in item.payload) {
		return {
			prefix,
			title: item.payload.community.title,
		};
	}
	return { title: 'an unknown Community' };
};
