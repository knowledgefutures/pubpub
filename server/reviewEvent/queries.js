import { ReviewEvent } from '../models';

export const createReviewEvent = (inputValues, userId) => {
	return ReviewEvent.create({
		type: inputValues.type,
		data: inputValues.data,
		userId: userId,
		pubId: inputValues.pubId,
		reviewId: inputValues.reviewId,
	});
};

export const updateReviewEvent = (inputValues, updatePermissions) => {
	// Filter to only allow certain fields to be updated
	const filteredValues = {};
	Object.keys(inputValues).forEach((key) => {
		if (updatePermissions.includes(key)) {
			filteredValues[key] = inputValues[key];
		}
	});

	return ReviewEvent.update(filteredValues, {
		where: { id: inputValues.reviewEventId },
	}).then(() => {
		return filteredValues;
	});
};

export const destroyReviewEvent = (inputValues) => {
	return ReviewEvent.destroy({
		where: { id: inputValues.reviewEventId },
	});
};

/* Event helpers */
/* ------------- */
export const createCreatedReviewEvent = (userId, pubId, reviewId) => {
	return createReviewEvent(
		{
			pubId: pubId,
			reviewId: reviewId,
			type: 'status',
			data: { statusChange: 'created' },
		},
		userId,
	);
};

export const createClosedReviewEvent = (userId, pubId, reviewId) => {
	return createReviewEvent(
		{
			pubId: pubId,
			reviewId: reviewId,
			type: 'status',
			data: { statusChange: 'closed' },
		},
		userId,
	);
};

export const createCompletedReviewEvent = (userId, pubId, reviewId) => {
	return createReviewEvent(
		{
			pubId: pubId,
			reviewId: reviewId,
			type: 'status',
			data: { statusChange: 'completed' },
		},
		userId,
	);
};

export const createCommentReviewEvent = (userId, pubId, reviewId, note) => {
	return createReviewEvent(
		{
			pubId: pubId,
			reviewId: reviewId,
			type: 'comment',
			data: { text: note },
		},
		userId,
	);
};
