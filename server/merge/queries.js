import { Merge, Review, Branch } from '../models';
import { mergeFirebaseBranch } from '../utils/firebaseAdmin';
import { createBranchExports } from '../export/queries';

export const createMerge = (inputValues, userData) => {
	return mergeFirebaseBranch(
		inputValues.pubId,
		inputValues.sourceBranchId,
		inputValues.destinationBranchId,
	)
		.then(() => {
			const createDate = new Date();
			const createMergeObject = Merge.create({
				noteContent: inputValues.noteContent,
				noteText: inputValues.noteText,
				userId: userData.id,
				pubId: inputValues.pubId,
				sourceBranchId: inputValues.sourceBranchId,
				destinationBranchId: inputValues.destinationBranchId,
				createdAt: createDate,
				updatedAt: createDate,
			});
			const setFirstKeyAt = Branch.update(
				{ firstKeyAt: createDate },
				{
					where: {
						id: inputValues.destinationBranchId,
						firstKeyAt: null,
					},
				},
			);
			const setLatestKeyAt = Branch.update(
				{ latestKeyAt: createDate },
				{
					where: {
						id: inputValues.destinationBranchId,
					},
				},
			);
			return Promise.all([createMergeObject, setFirstKeyAt, setLatestKeyAt]);
		})
		.then(([newMergeData]) => {
			const updateReview = Review.update(
				{ mergeId: newMergeData.id },
				{
					where: { id: inputValues.reviewId || null },
				},
			);
			return Promise.all([newMergeData, updateReview]);
		})
		.then(async ([newMergeData, newReviewEvent]) => {
			await createBranchExports(inputValues.pubId, inputValues.destinationBranchId);
			return { newMerge: newMergeData, newReviewEvents: [newReviewEvent] };
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
