/* eslint-disable no-console, no-restricted-syntax, import/first */
import Promise from 'bluebird';
import Slowdance from 'slowdance';
import { uncompressStepJSON, compressStateJSON } from 'prosemirror-compress-pubpub';
import { Step } from 'prosemirror-transform';
import { Node } from 'prosemirror-model';

import { getBranchRef, editorSchema } from 'server/utils/firebaseAdmin';
import { Pub, Branch } from 'server/models';

const overwriteExisting = true;
const checkpointInterval = 100;
const slowdance = new Slowdance({ onExit: () => process.exit() });

const skipPubIdsList = [];

const statusMessage = (success, created) => {
	return created ? '✨' : success ? '🥚' : '😱';
};

const getAllPubsWithBranches = () => {
	return Pub.findAll({
		attributes: ['id', 'slug', 'title'],
		include: [
			{
				model: Branch,
				as: 'branches',
				required: true,
				attributes: ['id', 'title'],
			},
		],
	});
};

const getEmptyDoc = () => {
	return Node.fromJSON(editorSchema, {
		type: 'doc',
		attrs: { meta: {} },
		content: [{ type: 'paragraph' }],
	});
};

const isCheckpointKey = (key) => {
	const intKey = parseInt(key, 10);
	return intKey > 0 && intKey % checkpointInterval === 0;
};

const createCheckpoint = (doc, timestamp, key) => {
	return {
		d: compressStateJSON({ doc: doc.toJSON() }).d,
		t: timestamp,
		k: parseInt(key, 10),
	};
};

const applyKeyableToDoc = (doc, keyable) => {
	const keyableArray = Array.isArray(keyable) ? keyable : [keyable];
	let timestamp;
	let nextDoc = doc;
	for (const compressedKeyable of keyableArray) {
		const { t: keyableTimestamp, s: compressedSteps } = compressedKeyable;
		timestamp = keyableTimestamp;
		for (const compressedStep of Object.values(compressedSteps)) {
			const step = Step.fromJSON(editorSchema, uncompressStepJSON(compressedStep));
			const stepResult = step.apply(nextDoc);
			if (stepResult.failed) {
				throw new Error('uh oh! ' + stepResult.failed);
			}
			nextDoc = stepResult.doc;
		}
	}
	return { doc: nextDoc, timestamp: timestamp };
};

const createCheckpointsFromKeyables = (keyables, existingCheckpointKeys) => {
	const initialState = { checkpoints: {}, checkpointMap: {}, doc: getEmptyDoc() };
	return Object.entries(keyables).reduce((state, [key, keyable]) => {
		const { checkpoints, checkpointMap, doc } = state;
		const { doc: nextDoc, timestamp } = applyKeyableToDoc(doc, keyable);
		if (isCheckpointKey(key) && !existingCheckpointKeys.includes(key)) {
			return {
				checkpoints: {
					...checkpoints,
					[key]: createCheckpoint(nextDoc, timestamp, key),
				},
				checkpointMap: {
					...checkpointMap,
					[key]: timestamp,
				},
				doc: nextDoc,
			};
		}
		return { checkpoints: checkpoints, checkpointMap: checkpointMap, doc: nextDoc };
	}, initialState);
};

const backfillCheckpointsForBranch = async (pubId, branchId) =>
	new Promise(async (resolve, reject) => {
		setTimeout(() => reject(new Error('Timed out')), 60 * 1000);
		try {
			const branchRef = getBranchRef(pubId, branchId);
			const [checkpoints, checkpointMap, changes, merges] = await Promise.all([
				branchRef.child('checkpoints').once('value'),
				branchRef.child('checkpointMap').once('value'),
				branchRef
					.child('changes')
					.orderByKey()
					.once('value'),
				branchRef
					.child('merges')
					.orderByKey()
					.once('value'),
			]);
			const allKeyables = { ...changes.val(), ...merges.val() };
			const keyablesLength = Object.keys(allKeyables).length;
			if (keyablesLength > 10000) {
				throw new Error(`Too many keyables: ${keyablesLength}`);
			}
			const existingCheckpoints = checkpoints.val() || {};
			const existingCheckpointMap = checkpointMap.val() || {};
			const {
				checkpoints: newCheckpoints,
				checkpointMap: newCheckpointMap,
			} = createCheckpointsFromKeyables(
				allKeyables,
				overwriteExisting ? [] : Object.keys(existingCheckpoints),
			);
			const hasCreatedNewCheckpoints = Object.keys(newCheckpoints).length > 0;
			if (hasCreatedNewCheckpoints) {
				await Promise.all([
					branchRef
						.child('checkpoints')
						.set({ ...existingCheckpoints, ...newCheckpoints }),
					branchRef
						.child('checkpointMap')
						.set({ ...existingCheckpointMap, ...newCheckpointMap }),
				]);
			}
			resolve(hasCreatedNewCheckpoints);
		} catch (err) {
			reject(err);
		}
	});

const backfillCheckpointsForPub = (pub) => {
	if (skipPubIdsList.includes(pub.slug)) {
		return null;
	}
	return Promise.all(
		pub.branches.map((branch) =>
			slowdance
				.wrapPromise(
					backfillCheckpointsForBranch(pub.id, branch.id).then((createdCheckpoints) =>
						statusMessage(true, createdCheckpoints),
					),
					{ label: `[${pub.slug}.${branch.title}] ${pub.title}` },
				)
				.catch(() => {}),
		),
	);
};

const main = async () => {
	slowdance.start();
	const allPubs = await getAllPubsWithBranches();
	await Promise.map(allPubs, backfillCheckpointsForPub, { concurrency: 5 });
};

main();
