import * as types from 'types';
import { DefinitelyHas } from 'types';
import { Discussion, Pub, ReviewNew, Visibility, VisibilityUser } from 'server/models';
import { getMembersForScope } from 'server/member/queries';

type CanUserSeeThreadOptions = {
	userId: string;
	threadId: string;
};

type FilterUsersOptions = {
	userIds: string[];
	threadId: string;
};

export const filterUsersWhoCanSeeThread = async (
	options: FilterUsersOptions,
): Promise<string[]> => {
	const { userIds, threadId } = options;
	const [parentDiscussion, parentReview]: [
		null | DefinitelyHas<types.Discussion, 'visibility' | 'pub'>,
		null | DefinitelyHas<types.Review, 'visibility' | 'pub'>,
	] = await Promise.all([
		Discussion.findOne({
			where: { threadId },
			include: [
				{ model: Visibility, as: 'visibility' },
				{ model: Pub, as: 'pub' },
			],
		}),
		ReviewNew.findOne({
			where: { threadId },
			include: [
				{ model: Visibility, as: 'visibility' },
				{ model: Pub, as: 'pub' },
			],
		}),
	]);
	const parentItem = parentDiscussion || parentReview;
	if (parentItem) {
		const {
			visibility: { access, id: visibilityId },
		} = parentItem;
		if (access === 'public') {
			return userIds;
		}
		if (access === 'members') {
			const { pub } = parentItem;
			const members = await getMembersForScope({
				communityId: pub.communityId,
				pubId: pub.id,
			});
			const memberUserIds = new Set(members.map((member) => member.userId));
			return userIds.filter((userId) => memberUserIds.has(userId));
		}
		const visibilityUsers = await VisibilityUser.findAll({ where: { visibilityId } });
		const visibilityUserIds = new Set(visibilityUsers.map((vu) => vu.userId));
		return userIds.filter((userId) => visibilityUserIds.has(userId));
	}
	return [];
};

export const canUserSeeThread = async (options: CanUserSeeThreadOptions): Promise<boolean> => {
	const { userId, threadId } = options;
	const [maybeUserId] = await filterUsersWhoCanSeeThread({ threadId, userIds: [userId] });
	return maybeUserId === userId;
};
