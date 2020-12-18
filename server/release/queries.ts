import { Release, Branch } from 'server/models';
import { mergeFirebaseBranch, getLatestKey } from 'server/utils/firebaseAdmin';
import { updateVisibilityForDiscussions } from 'server/discussion/queries';
import { createBranchExports } from 'server/export/queries';
import { createDoc } from 'server/doc/queries';

type ReleaseErrorReason = 'merge-failed' | 'duplicate-release';
export class ReleaseQueryError extends Error {
	// eslint-disable-next-line no-useless-constructor
	constructor(reason: ReleaseErrorReason) {
		super(reason);
	}
}

export const createRelease = async ({
	userId,
	pubId,
	draftKey,
	noteContent,
	noteText,
	makeDraftDiscussionsPublic,
	createExports = true,
}) => {
	const pubBranches = await Branch.findAll({ where: { pubId: pubId } });
	const draftBranch = pubBranches.find((branch) => branch.title === 'draft');
	const publicBranch = pubBranches.find((branch) => branch.title === 'public');

	if (!draftBranch || !publicBranch) {
		throw new Error('Cannot create a release on a Pub without a draft and public branch.');
	}

	if (!draftKey && draftKey !== 0) {
		// eslint-disable-next-line no-param-reassign
		draftKey = await getLatestKey(pubId, draftBranch.id);
	}

	const existingRelease = await Release.findOne({
		where: {
			pubId: pubId,
			sourceBranchId: draftBranch.id,
			sourceBranchKey: draftKey,
		},
	});

	if (existingRelease) {
		throw new ReleaseQueryError('duplicate-release');
	}

	const mergeResult = await mergeFirebaseBranch(
		pubId,
		draftBranch.id,
		publicBranch.id,
		makeDraftDiscussionsPublic,
	);

	if (!mergeResult) {
		throw new ReleaseQueryError('merge-failed');
	}

	const { mergeKey, doc } = mergeResult;
	const docModel = await createDoc(doc);

	const newRelease = await Release.create({
		noteContent: noteContent,
		noteText: noteText,
		sourceBranchId: draftBranch.id,
		sourceBranchKey: draftKey,
		historyKey: draftKey,
		branchId: publicBranch.id,
		branchKey: mergeKey,
		userId: userId,
		pubId: pubId,
		docId: docModel.id,
	});

	if (createExports) {
		await createBranchExports(pubId, publicBranch.id);
	}

	if (makeDraftDiscussionsPublic) {
		await updateVisibilityForDiscussions({ pubId: pubId }, { access: 'public' });
	}

	return newRelease.toJSON();
};
