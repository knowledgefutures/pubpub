import { attributesPublicUser } from '../utils';
import { User, Discussion } from '../models';

export const createDiscussion = (inputValues) => {
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
				userId: inputValues.userId,
				pubId: inputValues.pubId,
				communityId: inputValues.communityId,
				branchId: inputValues.branchId,
				threadNumber: inputValues.threadNumber || maxThreadNumber + 1,
			});
		})
		.then((newDiscussion) => {
			const findDiscussion = Discussion.findOne({
				where: {
					id: newDiscussion.id,
				},
				include: [
					{
						model: User,
						as: 'author',
						attributes: attributesPublicUser,
					},
				],
			});

			return findDiscussion;
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
	}).then(() => {
		return {
			...filteredValues,
			id: inputValues.discussionId,
		};
	});
};
