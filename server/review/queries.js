import uuidv4 from 'uuid/v4';
import { Thread, Visibility, ReviewNew } from '../models';
import {
	createCreatedThreadEvent,
	createClosedThreadEvent,
	createCompletedThreadEvent,
} from '../threadEvent/queries';
import { createThreadComment } from '../threadComment/queries';

export const createReview = async (inputValues, userData) => {
	const reviews = await ReviewNew.findAll({
		where: {
			pubId: inputValues.pubId,
		},
		attributes: ['id', 'pubId', 'number'],
		raw: true,
	});

	const maxNumber = reviews.reduce((prev, curr) => {
		if (Number(curr.number) > prev) {
			return Number(curr.number);
		}
		return prev;
	}, 0);
	const threadId = uuidv4();
	const visibilityId = uuidv4();
	await Promise.all([
		Visibility.create({
			id: visibilityId,
			access: 'members',
		}),
		Thread.create({
			id: threadId,
		}),
	]);

	const reviewData = await ReviewNew.create({
		title: 'Publication Request',
		number: maxNumber + 1,
		releaseRequested: inputValues.releaseRequested,
		threadId: threadId,
		visibilityId: visibilityId,
		userId: userData.id,
		pubId: inputValues.pubId,
	});

	await createCreatedThreadEvent(userData, threadId);
	if (inputValues.text) {
		await createThreadComment(
			{ threadId: threadId, content: inputValues.content, text: inputValues.text },
			userData,
		);
	}

	return reviewData;
};

export const updateReview = async (inputValues, updatePermissions, userData) => {
	// Filter to only allow certain fields to be updated
	const filteredValues = {};
	Object.keys(inputValues).forEach((key) => {
		if (updatePermissions.includes(key)) {
			filteredValues[key] = inputValues[key];
		}
	});

	const previousReview = ReviewNew.findOne({
		where: { id: inputValues.reviewId },
		attributes: ['id', 'status'],
	});
	return ReviewNew.update(filteredValues, {
		where: { id: inputValues.reviewId },
		returning: true,
	})
		.then((updatedReview) => {
			if (!updatedReview[0]) {
				return {};
			}
			const nextValues = updatedReview[1][0].get();
			const prevStatus = previousReview.status;
			const wasClosed = prevStatus !== 'closed' && nextValues.status === 'closed';
			const wasCompleted = prevStatus !== 'completed' && nextValues.status === 'completed';
			if (wasClosed) {
				return Promise.all[createClosedThreadEvent(userData, nextValues.threadId)];
			}
			if (wasCompleted) {
				return Promise.all[createCompletedThreadEvent(userData, nextValues.threadId)];
			}
			return [];
		})
		.then((newReviewEvents) => {
			return { updatedValues: filteredValues, newReviewEvents: newReviewEvents };
		});
};

export const destroyReview = (inputValues) => {
	return ReviewNew.destroy({
		where: { id: inputValues.reviewId },
	});
};
