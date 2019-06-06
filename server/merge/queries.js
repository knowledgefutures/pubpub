import { Merge, Review } from '../models';
import { mergeFirebaseBranch } from '../utils/firebaseAdmin';

export const createMerge = (inputValues, userId) => {
	return mergeFirebaseBranch(
		inputValues.pubId,
		inputValues.sourceBranchId,
		inputValues.destinationBranchId,
	)
		.then(() => {
			return Merge.create({
				note: inputValues.note,
				userId: userId,
				pubId: inputValues.pubId,
				sourceBranchId: inputValues.sourceBranchId,
				destinationBranchId: inputValues.destinationBranchId,
			});
		})
		.then((newMergeData) => {
			const updateReview = Review.update(
				{ mergeId: newMergeData.id },
				{
					where: { id: inputValues.reviewId || null },
				},
			);
			return Promise.all([newMergeData, updateReview]);
		})
		.then(([newMergeData]) => {
			return newMergeData;
		});
};

export const updateMerge = (inputValues, updatePermissions) => {
	// Filter to only allow certain fields to be updated
	const filteredValues = {};
	Object.keys(inputValues).forEach((key) => {
		if (updatePermissions.includes(key)) {
			filteredValues[key] = inputValues[key];
		}
	});

	return Merge.update(filteredValues, {
		where: { id: inputValues.mergeId },
	}).then(() => {
		return filteredValues;
	});
};

export const destroyMerge = (inputValues) => {
	return Merge.destroy({
		where: { id: inputValues.mergeId },
	});
};
