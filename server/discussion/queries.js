import { attributesPublicUser } from '../utils';
import { User, Discussion } from '../models';
import { updateFirebaseDiscussion } from '../utils/firebaseAdmin';

const findDiscussionWithUser = (id) =>
	Discussion.findOne({
		where: {
			id: id,
		},
		include: [
			{
				model: User,
				as: 'author',
				attributes: attributesPublicUser,
			},
		],
	});

export const createDiscussion = (inputValues, user) => {
	return Discussion.findAll({
		where: {
			pubId: inputValues.pubId,
		},
		attributes: ['id', 'pubId', 'threadNumber'],
	})
		.then((discussions) => {
			// This is non-atomic and could create race conditions
			// if two people create new discussion threads at the same time
			// on the same pub
			const maxThreadNumber = discussions.reduce((prev, curr) => {
				if (curr.threadNumber > prev) {
					return curr.threadNumber;
				}
				return prev;
			}, 0);

			const months = [
				'Jan',
				'Feb',
				'Mar',
				'Apr',
				'May',
				'Jun',
				'Jul',
				'Aug',
				'Sep',
				'Oct',
				'Nov',
				'Dec',
			];
			const date = new Date();
			const dateString = `${months[date.getMonth()]} ${date.getDate()}`;
			const isReply = !!inputValues.threadNumber;
			const generatedTitle = isReply ? '' : `New Discussion on ${dateString}`;

			return Discussion.create({
				id: inputValues.discussionId,
				title: inputValues.title || generatedTitle,
				content: inputValues.content,
				text: inputValues.text,
				initAnchorText: inputValues.initAnchorText,
				userId: user.id,
				pubId: inputValues.pubId,
				communityId: inputValues.communityId,
				branchId: inputValues.branchId,
				threadNumber: inputValues.threadNumber || maxThreadNumber + 1,
			});
		})
		.then(async (newDiscussion) => {
			const discussionWithUser = await findDiscussionWithUser(newDiscussion.id);
			updateFirebaseDiscussion(discussionWithUser.toJSON());
			return discussionWithUser;
		});
};

export const updateDiscussion = (inputValues, updatePermissions) => {
	// Filter to only allow certain fields to be updated
	const filteredValues = {};
	Object.keys(inputValues).forEach((key) => {
		if (updatePermissions.includes(key)) {
			filteredValues[key] = inputValues[key];
		}
	});
	return Discussion.update(filteredValues, {
		where: { id: inputValues.discussionId },
	}).then(async () => {
		const discussionWithUser = await findDiscussionWithUser(inputValues.discussionId);
		updateFirebaseDiscussion(discussionWithUser.toJSON());
		return {
			...filteredValues,
			id: inputValues.discussionId,
		};
	});
};
