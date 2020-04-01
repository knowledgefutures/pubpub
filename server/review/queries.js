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

export const updateReview = (inputValues, updatePermissions, userData) => {
	// Filter to only allow certain fields to be updated
	const filteredValues = {};
	Object.keys(inputValues).forEach((key) => {
		if (updatePermissions.includes(key)) {
			filteredValues[key] = inputValues[key];
		}
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
			const prevValues = updatedReview[1][0].previous();
			const wasClosed = prevValues.status !== 'closed' && nextValues.status === 'closed';
			const wasCompleted =
				prevValues.status !== 'completed' && nextValues.status === 'completed';
			if (wasClosed) {
				return createClosedThreadEvent(userData, updatedReview.threadId);
			}
			if (wasCompleted) {
				return createCompletedThreadEvent(userData, updatedReview.threadId);
			}
			return null;
		})
		.then((newReviewEvent) => {
			return { updatedValues: filteredValues, newReviewEvents: [newReviewEvent] };
		});
};

export const destroyReview = (inputValues) => {
	return ReviewNew.destroy({
		where: { id: inputValues.reviewId },
	});
};
