import { InsertableActivityItem, MemberActivityItem } from 'types';

import { ActivityRenderContext, Title, TitleRenderer } from '../types';
import { getUserFromContext } from './util';

const getUserTitleFromUserIdAndContext = (
	userId: string,
	context: ActivityRenderContext,
): Title => {
	if (userId === context.userId) {
		return { title: 'you' };
	}
	const userFromContext = getUserFromContext(userId, context);
	if (userFromContext) {
		return {
			title: userFromContext.fullName,
			href: `/user/${userFromContext.slug}`,
		};
	}
	return {
		title: 'unknown user',
	};
};

export const actorTitle: TitleRenderer<InsertableActivityItem> = (item, context) => {
	return getUserTitleFromUserIdAndContext(item.actorId, context);
};

export const memberTitle: TitleRenderer<MemberActivityItem> = (item, context) => {
	return getUserTitleFromUserIdAndContext(item.payload.userId, context);
};
