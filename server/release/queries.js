import { Release, Branch } from 'server/models';
import { mergeFirebaseBranch } from 'server/utils/firebaseAdmin';

export const createRelease = async ({ userId, pubId, draftKey, noteContent, noteText }) => {
	const pubBranches = await Branch.findAll({ where: { pubId: pubId } });
	const draftBranch = pubBranches.find((branch) => branch.title === 'draft');
	const publicBranch = pubBranches.find((branch) => branch.title === 'public');

	if (!draftBranch || !publicBranch) {
		throw new Error('Cannot create a release on a Pub without a draft and public branch.');
	}

	const existingRelease = await Release.findOne({
		where: {
			pubId: pubId,
			sourceBranchId: draftBranch.id,
			sourceBranchKey: draftKey,
		},
	});

	if (existingRelease) {
		throw new Error("Can't make a duplicate release");
	}

	const mergeResult = await mergeFirebaseBranch(pubId, draftBranch.id, publicBranch.id);

	if (!mergeResult) {
		throw new Error('Firebase branches were not merged.');
	}

	const { mergeKey } = mergeResult;

	const newRelease = await Release.create({
		noteContent: noteContent,
		noteText: noteText,
		sourceBranchId: draftBranch.id,
		sourceBranchKey: draftKey,
		branchId: publicBranch.id,
		branchKey: mergeKey,
		userId: userId,
		pubId: pubId,
	});

	return newRelease.toJSON();
};
