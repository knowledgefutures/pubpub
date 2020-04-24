import { attributesPublicUser } from '../utils/attributesPublicUser';
import {
	User,
	DiscussionNew,
	Anchor,
	Thread,
	ThreadComment,
	ThreadEvent,
	Visibility,
} from '../models';
import { updateFirebaseDiscussion } from '../utils/firebaseAdmin';

const findDiscussionWithUser = (id) =>
	DiscussionNew.findOne({
		where: {
			id: id,
		},
		include: [
			{
				model: User,
				as: 'author',
				attributes: attributesPublicUser,
			},
			{ model: Anchor, as: 'anchor' },
			{
				model: Visibility,
				as: 'visibility',
				include: [
					{
						model: User,
						as: 'users',
						attributes: attributesPublicUser,
					},
				],
			},
			{
				model: Thread,
				as: 'thread',
				include: [
					{
						model: ThreadComment,
						as: 'comments',
						include: [
							{
								model: User,
								as: 'author',
								attributes: attributesPublicUser,
							},
						],
					},
					{
						model: ThreadEvent,
						as: 'events',
						include: [
							{
								model: User,
								as: 'user',
								attributes: attributesPublicUser,
							},
						],
					},
				],
			},
		],
	});

export const createDiscussion = async (inputValues, user) => {
	const discussions = await DiscussionNew.findAll({
		where: {
			pubId: inputValues.pubId,
		},
		attributes: ['id', 'pubId', 'number'],
	});
	// This is non-atomic and could create race conditions
	// if two people create new discussion threads at the same time
	// on the same pub
	const maxThreadNumber = discussions.reduce((prev, curr) => {
		if (curr.number > prev) {
			return curr.number;
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
	// const isReply = !!inputValues.threadNumber;
	const generatedTitle = `New Discussion on ${dateString}`;

	let newAnchor = {};
	if (inputValues.initAnchorData) {
		const { prefix, suffix, exact, from, to } = inputValues.initAnchorData;
		newAnchor = await Anchor.create({
			prefix: prefix,
			exact: exact,
			suffix: suffix,
			from: from,
			to: to,
			branchKey: inputValues.branchKey,
			branchId: inputValues.branchId,
		});
	}
	const newThread = await Thread.create({});
	await ThreadComment.create({
		text: inputValues.text,
		content: inputValues.content,
		userId: user.id,
		threadId: newThread.id,
	});
	const newVisibility = await Visibility.create({
		access: 'members',
	});
	const newDiscussion = await DiscussionNew.create({
		id: inputValues.discussionId,
		title: inputValues.title || generatedTitle,
		number: maxThreadNumber + 1,
		threadId: newThread.id,
		visibilityId: newVisibility.id,
		userId: user.id,
		anchorId: newAnchor.id,
		pubId: inputValues.pubId,
	});
	const discussionWithUser = await findDiscussionWithUser(newDiscussion.id);
	updateFirebaseDiscussion(discussionWithUser.toJSON(), inputValues.branchId);
	return discussionWithUser;
};

export const updateDiscussion = (inputValues, updatePermissions) => {
	// Filter to only allow certain fields to be updated
	const filteredValues = {};
	Object.keys(inputValues).forEach((key) => {
		if (updatePermissions.includes(key)) {
			filteredValues[key] = inputValues[key];
		}
	});
	return DiscussionNew.update(filteredValues, {
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
