import { attributesPublicUser } from '../utils/attributesPublicUser';
import { ReviewEvent } from '../models';

export const createReviewEvent = (inputValues, userData) => {
	return ReviewEvent.create({
		type: inputValues.type,
		data: inputValues.data,
		userId: userData.id,
		pubId: inputValues.pubId,
		reviewId: inputValues.reviewId,
	}).then((newReviewEvent) => {
		/* Populate user data so it can be inserted into */
		/* existing pubData client-side */
		const cleanedUserData = {};
		attributesPublicUser.forEach((key) => {
			cleanedUserData[key] = userData[key];
		});
		return {
			...newReviewEvent.toJSON(),
			user: cleanedUserData,
		};
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
export const createCreatedReviewEvent = (userData, pubId, reviewId) => {
	return createReviewEvent(
		{
			pubId: pubId,
			reviewId: reviewId,
			type: 'status',
			data: { statusChange: 'created' },
		},
		userData,
	);
};

export const createClosedReviewEvent = (userData, pubId, reviewId) => {
	return createReviewEvent(
		{
			pubId: pubId,
			reviewId: reviewId,
			type: 'status',
			data: { statusChange: 'closed' },
		},
		userData,
	);
};

export const createCompletedReviewEvent = (userData, pubId, reviewId) => {
	return createReviewEvent(
		{
			pubId: pubId,
			reviewId: reviewId,
			type: 'status',
			data: { statusChange: 'completed' },
		},
		userData,
	);
};

export const createMergedReviewEvent = (userData, pubId, reviewId) => {
	return createReviewEvent(
		{
			pubId: pubId,
			reviewId: reviewId,
			type: 'status',
			data: { statusChange: 'merged' },
		},
		userData,
	);
};

export const createCommentReviewEvent = (userData, pubId, reviewId, content, text) => {
	return createReviewEvent(
		{
			pubId: pubId,
			reviewId: reviewId,
			type: 'comment',
			data: { content: content, text: text },
		},
		userData,
	);
};
