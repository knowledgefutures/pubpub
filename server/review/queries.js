import { Review } from '../models';
import {
	createCreatedReviewEvent,
	createClosedReviewEvent,
	createCompletedReviewEvent,
	createCommentReviewEvent,
} from '../reviewEvent/queries';

export const createReview = (inputValues, userId) => {
	return Review.findAll({
		where: {
			pubId: inputValues.pubId,
		},
		attributes: ['id', 'pubId', 'shortId'],
	}).then((reviews) => {
		const maxShortId = reviews.reduce((prev, curr) => {
			if (curr.shortId > prev) {
				return curr.shortId;
			}
			return prev;
		}, 0);
		return Review.create({
			shortId: maxShortId + 1,
			pubId: inputValues.pubId,
			sourceBranchId: inputValues.sourceBranchId,
			destinationBranchId: inputValues.destinationBranchId,
		})
			.then((reviewData) => {
				const reviewEvents = [
					createCreatedReviewEvent(userId, reviewData.pubId, reviewData.id),
				];
				if (inputValues.note) {
					reviewEvents.push(
						createCommentReviewEvent(
							userId,
							reviewData.pubId,
							reviewData.id,
							inputValues.note,
						),
					);
				}
				return Promise.all([reviewData, ...reviewEvents]);
			})
			.then(([reviewData]) => {
				return reviewData;
			});
	});
};

export const updateReview = (inputValues, updatePermissions, userId) => {
	// Filter to only allow certain fields to be updated
	const filteredValues = {};
	Object.keys(inputValues).forEach((key) => {
		if (updatePermissions.includes(key)) {
			filteredValues[key] = inputValues[key];
		}
	});

	return Review.update(filteredValues, {
		where: { id: inputValues.reviewId },
		returning: true,
	})
		.then((updatedReview) => {
			if (!updatedReview[0]) {
				return {};
			}

			const nextValues = updatedReview[1][0].get();
			const prevValues = updatedReview[1][0].previous();
			const wasClosed = !prevValues.isClosed && nextValues.isClosed;
			const wasCompleted = !prevValues.isCompleted && nextValues.isCompleted;
			if (wasClosed && !wasCompleted) {
				return createClosedReviewEvent(userId, inputValues.pubId, inputValues.reviewId);
			}
			if (wasCompleted) {
				return createCompletedReviewEvent(userId, inputValues.pubId, inputValues.reviewId);
			}
			return null;
		})
		.then(() => {
			return filteredValues;
		});
};

export const destroyReview = (inputValues) => {
	return Review.destroy({
		where: { id: inputValues.reviewId },
	});
};
