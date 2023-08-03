import * as types from 'types';
import { Discussion, Pub, ReviewNew, Visibility, Thread } from 'server/models';
import { filterUsersAcceptedByVisibility } from 'server/visibility/queries';

type FilterUsersOptions = {
	userIds: string[];
	threadId: string;
};

export const getParentModelForThread = async <AssociatedModels = {}>(
	threadId: string,
	queryOptions: any = {},
): Promise<null | types.TaggedThreadParent<AssociatedModels>> => {
	const [discussion, review]: [
		null | (types.Discussion & AssociatedModels),
		null | (types.Review & AssociatedModels),
	] = await Promise.all([
		Discussion.findOne({ where: { threadId }, ...queryOptions }),
		ReviewNew.findOne({ where: { threadId }, ...queryOptions }),
	]);
	if (discussion) {
		return { type: 'discussion', value: discussion };
	}
	if (review) {
		return { type: 'review', value: review };
	}
	return null;
};

export const filterUsersWhoCanSeeThread = async (
	options: FilterUsersOptions,
): Promise<string[]> => {
	const { userIds, threadId } = options;

	const parent = await getParentModelForThread<{
		visibility: types.Visibility;
		pub: types.Pub;
	}>(threadId, {
		include: [
			{ model: Visibility, as: 'visibility' },
			{ model: Pub, as: 'pub' },
		],
	});

	if (parent) {
		const { visibility, pub } = parent.value;
		return filterUsersAcceptedByVisibility({
			visibility,
			scope: { pubId: pub.id, communityId: pub.communityId },
			userIds,
		});
	}
	return [];
};

type CanUserSeeThreadOptions = {
	userId: string;
	threadId: string;
};

export const canUserSeeThread = async (options: CanUserSeeThreadOptions): Promise<boolean> => {
	const { userId, threadId } = options;
	const [maybeUserId] = await filterUsersWhoCanSeeThread({ threadId, userIds: [userId] });
	return maybeUserId === userId;
};

export const createThread = async (): Promise<types.Thread> => {
	return Thread.create({});
};
