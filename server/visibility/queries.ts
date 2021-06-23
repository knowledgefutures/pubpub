import { Discussion, ReviewNew, Visibility } from 'server/models';
import * as types from 'types';
import { TaggedVisibilityParent } from 'types';

type UpdateOptions = {
	visibilityId: string;
	access: types.Visibility['access'];
};

export const getParentModelForVisibility = async (
	visibilityId: string,
): Promise<null | TaggedVisibilityParent> => {
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

export const updateVisibility = async (options: UpdateOptions) => {
	const { visibilityId, access } = options;
	const visibility = await Visibility.findOne({ where: { id: visibilityId } });
	visibility.access = access;
	await visibility.save();
};
