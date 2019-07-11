/* eslint-disable no-console, no-restricted-syntax */
const uuid = require('uuid');
const { Step, ReplaceStep } = require('prosemirror-transform');
const { Slice } = require('prosemirror-model');
const { compressStepJSON, uncompressStepJSON } = require('prosemirror-compress-pubpub');

const { error } = require('../problems');
const { fromFirebaseJson } = require('../util/firebaseJson');
const editorSchema = require('../util/editorSchema');

const PUBPUB_CLIENT_ID = 'clientId-b242f616-7aaa-479c-8ee5-3933dcf70859-migr8';

function Change(steps, clientId, timestamp, branchId, isOrphanedVersionChange) {
	if (!branchId) {
		throw error('Change does not have a branchId');
	}
	this.steps = steps;
	this.clientId = clientId;
	this.timestamp = timestamp;
	this.branchId = branchId;
	this.isOrphanedVersionChange = isOrphanedVersionChange;
	this.id = uuid.v4();
}

const uncompressChange = (compressedChange, draftBranchId) => {
	const { c: clientId, s: compressedStepsJson, t: timestamp } = compressedChange;
	const steps = Object.values(compressedStepsJson).map((stepJson) => {
		const uncompressedStepsJson = uncompressStepJSON(stepJson);
		return Step.fromJSON(editorSchema, uncompressedStepsJson);
	});
	return new Change(steps, clientId, timestamp, draftBranchId);
};

const compressChange = (change) => {
	return {
		id: change.id,
		cId: change.clientId.replace('clientId-', ''),
		bId: change.branchId,
		t: change.timestamp,
		s: change.steps.map((step) => compressStepJSON(step.toJSON())),
	};
};

const getChangesAndCheckpointForPub = (firebasePub) => {
	const { changes, checkpoint } = fromFirebaseJson(firebasePub);
	const draftBranchId = uuid.v4();
	return {
		draftBranchId: draftBranchId,
		checkpoint: checkpoint,
		changes:
			(changes &&
				Object.values(changes).reduce((changesArr, compressedChange) => {
					if (compressedChange) {
						return [...changesArr, uncompressChange(compressedChange, draftBranchId)];
					}
					return changesArr;
				}, [])) ||
			[],
	};
};

const createReplaceWholeDocumentChange = (
	startDocument,
	endDocument,
	draftBranchId,
	isOrphanedVersionChange,
) => {
	const replaceSlice = new Slice(endDocument.content, 0, 0);
	const replaceStep = new ReplaceStep(0, startDocument.nodeSize - 2, replaceSlice);
	return new Change(
		[replaceStep],
		PUBPUB_CLIENT_ID,
		Date.now(),
		draftBranchId,
		isOrphanedVersionChange,
	);
};

module.exports = {
	uncompressChange: uncompressChange,
	compressChange: compressChange,
	getChangesAndCheckpointForPub: getChangesAndCheckpointForPub,
	createReplaceWholeDocumentChange: createReplaceWholeDocumentChange,
	Change: Change,
};
