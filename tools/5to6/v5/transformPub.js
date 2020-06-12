/* eslint-disable no-console, no-restricted-syntax */
const uuid = require('uuid');

const { docToString, jsonToDoc } = require('../util/docUtils');
const { error, warn } = require('../problems');

const { Change, createReplaceWholeDocumentChange } = require('./changes');
const addDiscussions = require('./addDiscussions');
const Branch = require('./branch');
const PubWithBranches = require('./pubWithBranches');
const {
	IntermediateDocState,
	reconstructDocument,
	reconstructDocumentWithCheckpointFallback,
	newDocument,
} = require('./reconstructDocument');

function BranchPointer(branch, v5ChangeIndex, v6MergeIndex) {
	this.branch = branch;
	this.v5ChangeIndex = v5ChangeIndex;
	this.v6MergeIndex = v6MergeIndex;
}

const latestIntermediateStateBeforeVersion = (intermediateDocStates, version) => {
	const versionCreatedAtTime = new Date(version.createdAt).getTime();
	// Find the last IDS before the version was created
	const statesByDelta = intermediateDocStates
		.map((ids) => ({ ids: ids, delta: versionCreatedAtTime - ids.change.timestamp }))
		.filter(({ delta }) => delta >= 0)
		.sort((a, b) => a.delta - b.delta);
	if (statesByDelta.length) {
		return statesByDelta[0].ids;
	}
	return null;
};

const splitIntermediateDocStates = (states, targetState, targetDoc, draftBranchId) => {
	const nextStates = [];
	const passedTargetState = false;
	let newlyCreatedState = null;
	for (const state of states) {
		const { change } = state;
		if (state === targetState && change.steps) {
			const stepSplit = change.steps.reduce(
				(reduceState, nextStep) => {
					const { firstSteps, secondSteps, seenTarget } = reduceState;
					if (seenTarget) {
						return { ...reduceState, secondSteps: [...secondSteps, nextStep] };
					}
					const isTargetStep = state.docsWithinChange.get(nextStep) === targetDoc;
					return {
						...reduceState,
						firstSteps: [...firstSteps, nextStep],
						seenTarget: isTargetStep,
					};
				},
				{ firstSteps: [], secondSteps: [], seenTarget: false },
			);
			const { firstSteps, secondSteps } = stepSplit;
			if (state.docsWithinChange.get(firstSteps[firstSteps.length - 1]) !== targetDoc) {
				throw error(
					"Assertion failed while splitting IDS: final step doesn't match target doc",
				);
			}
			const changes = [
				new Change(firstSteps, change.clientId, change.timestamp, draftBranchId),
				new Change(secondSteps, change.clientId, change.timestamp, draftBranchId),
			];
			const resultingStates = [
				...reconstructDocument(changes, nextStates[nextStates.length - 1]),
			];
			if (resultingStates.length !== 2) {
				throw error(
					'Assertion failed while splitting IDS: wrong number of resulting states',
				);
			}
			if (docToString(resultingStates[0].doc) !== docToString(targetDoc)) {
				throw error(
					"Assertion failed while splitting IDS: first IDS doc doesn't match target doc",
				);
			}
			nextStates.push(...resultingStates);
			newlyCreatedState = resultingStates[0];
		} else if (passedTargetState) {
			state.index += 1;
			nextStates.push(
				new IntermediateDocState(
					state.doc,
					state.change,
					state.index + 1,
					state.docsWithinChange,
				),
			);
		} else {
			nextStates.push(state);
		}
	}
	return { nextStates: nextStates, newlyCreatedState: newlyCreatedState };
};

const mapVersionsToChangeIndices = (versions, intermediateDocStates, draftBranchId) => {
	const versionIndexMap = new Map();
	const orphanedVersions = [];
	versions.forEach((version) => {
		console.log('Checking version id', version.id);
		const extractedVersion = Array.isArray(version.content)
			? version.content[0]
			: version.content;
		const extractedSomeMoreVersion =
			extractedVersion.type === 'doc' ? extractedVersion : extractedVersion.content;
		const versionDoc = jsonToDoc(extractedSomeMoreVersion);
		const versionDocAsString = docToString(versionDoc);
		if (versionDoc.content.childCount === 1 && versionDoc.content.child(0).content.size === 0) {
			warn(`version id ${version.id} is empty`);
			versionIndexMap.set(version, 0);
			return;
		}
		const likelyMatch = latestIntermediateStateBeforeVersion(intermediateDocStates, version);
		const match = [likelyMatch]
			.filter((x) => x)
			.concat(intermediateDocStates)
			.find((s) => docToString(s.doc) === versionDocAsString);
		if (match) {
			versionIndexMap.set(version, match.index);
		} else {
			const matchWithinChange = intermediateDocStates
				.map((state) => {
					const docsWithinChange = [...state.docsWithinChange.values()];
					const matchingDocWithinChange = docsWithinChange.find(
						(docWithinChange) => docToString(docWithinChange) === versionDocAsString,
					);
					if (matchingDocWithinChange) {
						return { doc: matchingDocWithinChange, state: state };
					}
					return null;
				})
				.filter((x) => x)[0];
			const skipSplitIds = [
				'1936d637-7d7a-456b-9a0c-51e166450df3',
				'20253ff8-785c-4653-a642-83fc61ed4140',
				'23e35a84-c412-432f-a925-f0bd3614876f',
				'37acf165-8b30-4ff3-8fda-bd385010fbda',
			];
			if (matchWithinChange && !skipSplitIds.includes(version.pubId)) {
				const splitResult = splitIntermediateDocStates(
					intermediateDocStates,
					matchWithinChange.state,
					matchWithinChange.doc,
					draftBranchId,
				);
				// eslint-disable-next-line no-param-reassign
				intermediateDocStates = splitResult.nextStates;
				versionIndexMap.set(version, splitResult.newlyCreatedState.index);
				warn(`Split state at ${splitResult.newlyCreatedState.index} into two new states`);
			} else {
				orphanedVersions.push({ version: version, versionDoc: versionDoc });
			}
		}
	});
	orphanedVersions.forEach(({ version, versionDoc }) => {
		const mostRecentState = intermediateDocStates[intermediateDocStates.length - 1];
		const { value: nextState } = reconstructDocument(
			[
				createReplaceWholeDocumentChange(
					mostRecentState ? mostRecentState.doc : newDocument(),
					versionDoc,
					draftBranchId,
					true,
				),
			],
			mostRecentState,
		).next();
		versionIndexMap.set(version, nextState.index);
		warn(
			`creating ReplaceStep at index ${nextState.index} to accomodate orphan version ${version.id}`,
		);
		// eslint-disable-next-line no-param-reassign
		intermediateDocStates = [...intermediateDocStates, nextState];
	});
	return { versionIndexMap: versionIndexMap, intermediateDocStates: intermediateDocStates };
};

const serializePubVersionPermissions = (pub, versionId) => {
	const { isPublic } = pub.versions.find((v) => v.id === versionId);
	const versionPermissions = pub.versionPermissions.filter((vp) => vp.versionId === versionId);
	const publicOrPrivateString = isPublic ? 'public' : 'private';
	const userPermissionsString = versionPermissions
		.sort((a, b) => a.userId - b.userId)
		.map((vp) => `${vp.userId}-${vp.permissions}`)
		.join('_');
	if (userPermissionsString.length > 0) {
		return `${publicOrPrivateString}__${userPermissionsString}`;
	}
	return publicOrPrivateString;
};

const buildPubWithBranches = (pub, changes, versionToChangeIndex, draftBranchId) => {
	const branchByNameMap = new Map();
	const versionPermissionStringToBranchPointerMap = new Map();
	const versionToBranchPointerMap = new Map();
	// First, add a draft branch
	const draftBranch = new Branch('draft', draftBranchId);
	const nonOrphanedChanges = changes.filter((change) => !change.isOrphanedVersionChange);
	(nonOrphanedChanges.length > 0 ? nonOrphanedChanges : changes).forEach((change) =>
		draftBranch.addChange(change),
	);
	// Now create a new branch for every combination of permissions we see
	Array.from(versionToChangeIndex.entries())
		.sort((a, b) => a[1] - b[1])
		.forEach(([version, changeIndex]) => {
			const vpString = serializePubVersionPermissions(pub, version.id);
			let branchPointer;
			if (versionPermissionStringToBranchPointerMap.has(vpString)) {
				// This means there's already a version with permissions identical to one that
				// we've seen before. So we can grab that branch.
				branchPointer = versionPermissionStringToBranchPointerMap.get(vpString);
			} else {
				// We need to start a new branch
				const nextBranch = new Branch(vpString, uuid.v4());
				branchPointer = new BranchPointer(nextBranch, -1);
				branchByNameMap.set(vpString, nextBranch);
			}
			const { branch, v5ChangeIndex: previousEndIndex } = branchPointer;
			const merge = changes.slice(previousEndIndex + 1, changeIndex + 1);
			if (merge.length > 0) {
				branch.addMerge(merge, changeIndex);
			}
			const nextBranchPointer = new BranchPointer(
				branch,
				changeIndex,
				branch.getHighestMergeIndex(),
			);
			versionPermissionStringToBranchPointerMap.set(vpString, nextBranchPointer);
			versionToBranchPointerMap.set(version, nextBranchPointer);
		});
	return new PubWithBranches(pub, draftBranch, branchByNameMap, versionToBranchPointerMap);
};

const assertBranchPointersAreCorrect = (versionToBranchPointerMap, intermediateDocStates) => {
	versionToBranchPointerMap.forEach((branchPointer, version) => {
		const { branch, v6MergeIndex, v5ChangeIndex } = branchPointer;
		console.log('Checking branch for version id', version.id);
		const idsForBranch = branch.getDocState(v6MergeIndex);
		const idsForVersion = intermediateDocStates.find((ids) => ids.index === v5ChangeIndex);
		if (docToString(idsForBranch.doc) !== docToString(idsForVersion.doc)) {
			throw error('Branch does not contain correct subdocument');
		}
	});
};

const transformV5Pub = (
	pub,
	{ changes, checkpoint, draftBranchId },
	checkBranchPointers = true,
) => {
	const skipReconstructList = ['605c8e28-913a-48a6-98f9-fb81e02953e7'];

	let intermediateDocStates = skipReconstructList.includes(pub.id)
		? []
		: reconstructDocumentWithCheckpointFallback(changes, checkpoint, draftBranchId);
	const mapResult = mapVersionsToChangeIndices(
		pub.versions,
		intermediateDocStates,
		draftBranchId,
	);
	const versionToChangeIndexMap = mapResult.versionIndexMap;
	intermediateDocStates = mapResult.intermediateDocStates;
	const finalChanges = intermediateDocStates.map((state) => state.change);
	const pubWithBranches = buildPubWithBranches(
		pub,
		finalChanges,
		versionToChangeIndexMap,
		draftBranchId,
	);
	addDiscussions(pub, pubWithBranches);
	if (checkBranchPointers) {
		assertBranchPointersAreCorrect(
			pubWithBranches.versionToBranchPointerMap,
			intermediateDocStates,
		);
	}
	return pubWithBranches;
};

module.exports = transformV5Pub;
