import { InsertableActivityItem, MemberActivityItem } from 'types';
import { naivePluralize } from 'utils/strings';

import { ActivityRenderContext, Title, TitleRenderer } from '../types';
import { getUserFromContext } from './util';

const getUserTitleFromUserIdAndContext = (
	userId: null | string,
	context: ActivityRenderContext,
	fallback: string,
): Title => {
	if (userId) {
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
	}
	return {
		title: fallback,
	};
};

export const actorTitle: TitleRenderer<InsertableActivityItem> = (item, context) => {
	const { otherActorsCount } = context;
	const title = getUserTitleFromUserIdAndContext(item.actorId, context, 'someone');
	if (otherActorsCount) {
		const other = naivePluralize('other', otherActorsCount);
		return { ...title, suffix: `and ${otherActorsCount} ${other}` };
	}
	return title;
};

export const memberTitle: TitleRenderer<MemberActivityItem> = (item, context) => {
	return getUserTitleFromUserIdAndContext(item.payload.userId, context, 'unknown user');
};
