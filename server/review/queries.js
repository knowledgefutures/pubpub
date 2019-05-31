import { Review } from '../models';
import { mergeFirebaseBranch } from '../utils/firebaseAdmin';

export const createReview = (inputValues) => {
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
		});
	});
};

export const acceptReview = (inputValues) => {
	/* Accepting a review merges into the destinationBranch */
	/* and closes the review. If there is no destinationBranch */
	/* (i.e. you simply want to close the review), use updateReview() */
	const mergeBranches = mergeFirebaseBranch(
		inputValues.pubId,
		inputValues.sourceBranchId,
		inputValues.destinationBranchId,
	);
	const closeReview = inputValues.reviewId
		? Review.update(
				{ isClosed: true },
				{
					where: { id: inputValues.reviewId },
				},
		  )
		: undefined;
	return Promise.all([mergeBranches, closeReview]);
};

export const updateReview = (inputValues, updatePermissions) => {
	// Filter to only allow certain fields to be updated
	const filteredValues = {};
	Object.keys(inputValues).forEach((key) => {
		if (updatePermissions.includes(key)) {
			filteredValues[key] = inputValues[key];
		}
	});

	return Review.update(filteredValues, {
		where: { id: inputValues.reviewId },
	}).then(() => {
		return filteredValues;
	});
};

export const destroyReview = (inputValues) => {
	return Review.destroy({
		where: { id: inputValues.reviewId },
	});
};
