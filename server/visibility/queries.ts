import * as types from 'types';
import { getMembersForScope } from 'server/member/queries';
import { Discussion, ReviewNew, Visibility, VisibilityUser } from 'server/models';

export const getParentModelForVisibility = async (
	visibilityId: string,
): Promise<null | types.TaggedVisibilityParent> => {
	const [discussion, review]: [null | types.Discussion, null | types.Review] = await Promise.all([
		Discussion.findOne({ where: { visibilityId } }),
		ReviewNew.findOne({ where: { visibilityId } }),
	]);
	if (discussion) {
		return { type: 'discussion', value: discussion };
	}
	if (review) {
		return { type: 'review', value: review };
	}
	return null;
};

type UpdateOptions = {
	visibilityId: string;
	access: types.Visibility['access'];
};

export const updateVisibility = async (options: UpdateOptions) => {
	const { visibilityId, access } = options;
	const visibility = await Visibility.findOne({ where: { id: visibilityId } });
	visibility.access = access;
	await visibility.save();
};

type FilterUsersOptions = {
	visibility: types.Visibility;
	scope: types.ScopeId;
	userIds: string[];
};

export const filterUsersAcceptedByVisibility = async (options: FilterUsersOptions) => {
	const { visibility, userIds, scope } = options;
	const { access, id: visibilityId } = visibility;
	if (access === 'public') {
		return userIds;
	}
	if (access === 'members') {
		const members = await getMembersForScope(scope);
		const memberUserIds = new Set(members.map((member) => member.userId));
		return userIds.filter((userId) => memberUserIds.has(userId));
	}
	const visibilityUsers = await VisibilityUser.findAll({ where: { visibilityId } });
	const visibilityUserIds = new Set(visibilityUsers.map((vu) => vu.userId));
	return userIds.filter((userId) => visibilityUserIds.has(userId));
};
