/* eslint-disable no-restricted-syntax */
import { Op } from 'sequelize';
import { ForbiddenError } from 'server/utils/errors';
import {
	DiscussionNew,
	Anchor,
	Thread,
	ThreadComment,
	ThreadEvent,
	Pub,
	Visibility,
	includeUserModel,
} from 'server/models';

const findDiscussionWithUser = (id) =>
	DiscussionNew.findOne({
		where: {
			id: id,
		},
		include: [
			includeUserModel({ as: 'author' }),
			{ model: Anchor, as: 'anchor' },
			{
				model: Visibility,
				as: 'visibility',
				include: [includeUserModel({ as: 'users' })],
			},
			{
				model: Thread,
				as: 'thread',
				include: [
					{
						model: ThreadComment,
						as: 'comments',
						include: [includeUserModel({ as: 'author' })],
					},
					{
						model: ThreadEvent,
						as: 'events',
						include: [includeUserModel({ as: 'user' })],
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
		access: inputValues.visibilityAccess,
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
	return discussionWithUser;
};

export const updateDiscussion = async (values, permissions) => {
	const { discussionId, pubId } = values;
	const {
		canTitle,
		canApplyPublicLabels,
		canApplyManagedLabels,
		canClose,
		canReopen,
	} = permissions;
	const updatedValues = {};

	const [discussion, pub] = await Promise.all([
		DiscussionNew.findOne({ where: { id: discussionId } }),
		Pub.findOne({ where: { id: pubId }, attributes: ['id', 'labels'] }),
	]);

	if ('title' in values) {
		if (canTitle) {
			updatedValues.title = values.title;
		} else {
			throw new ForbiddenError();
		}
	}

	if ('isClosed' in values) {
		const canModifyClosed = values.isClosed ? canClose : canReopen;
		if (canModifyClosed) {
			updatedValues.isClosed = values.isClosed;
		} else {
			throw new ForbiddenError();
		}
	}

	if ('labels' in values) {
		const labels = [];
		const existingLabels = discussion.labels || [];
		const hasRemovedManagedLabels = existingLabels.some((labelId) => {
			const labelDefinition = pub.labels.find((label) => label.id === labelId);
			const missingFromUpdate = !values.labels.includes(labelId);
			return labelDefinition && !labelDefinition.publicApply && missingFromUpdate;
		});
		if (hasRemovedManagedLabels && !canApplyManagedLabels) {
			throw new ForbiddenError();
		}
		for (const labelId of values.labels) {
			const isExistingLabel = existingLabels.includes(labelId);
			const labelDefinition = pub.labels.find((label) => label.id === labelId);
			if (labelDefinition) {
				const { publicApply } = labelDefinition;
				const canLabel = publicApply ? canApplyPublicLabels : canApplyManagedLabels;
				if (isExistingLabel || canLabel) {
					labels.push(labelId);
				} else {
					throw new ForbiddenError();
				}
			}
		}
		updatedValues.labels = labels;
	}

	await discussion.update(updatedValues);
	return discussion;
};

export const updateVisibilityForDiscussions = async (discussionsWhereQuery, visibilityUpdate) => {
	const discussions = await DiscussionNew.findAll({ where: discussionsWhereQuery });
	const visibilityIds = discussions.map((d) => d.visibilityId);
	await Visibility.update(visibilityUpdate, { where: { id: { [Op.in]: visibilityIds } } });
};
