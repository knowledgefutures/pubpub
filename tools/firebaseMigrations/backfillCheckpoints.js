/* eslint-disable no-console, no-restricted-syntax, import/first */
import '../../server/config';

import registerIgnoredStyles from 'ignore-styles';
import Promise from 'bluebird';
import { uncompressStepJSON, compressStateJSON } from 'prosemirror-compress-pubpub';
import { Step } from 'prosemirror-transform';
import { Node } from 'prosemirror-model';

registerIgnoredStyles(['.scss']);

import { getBranchRef, editorSchema } from '../../server/utils/firebaseAdmin';
import { Pub, Branch } from '../../server/models';

const overwriteExisting = true;
const checkpointInterval = 100;

const statusMessage = (pub, branch, success, created) => {
	const emoji = created ? '✨' : success ? '🥚' : '😱';
	console.log(`${emoji} [${pub.slug}.${branch.title}] ${pub.title}`);
};

const getAllPubsWithBranches = () => {
	return Pub.findAll({
		where: {
			id: '95e12aa6-2043-46dd-8c2d-2c58242136d1',
			communityId: '97a10bb3-d6e7-46ec-8b75-d6a681d716be',
		},
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

const backfillCheckpointsForBranch = async (pubId, branchId) => {
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
			branchRef.child('checkpoints').set({ ...existingCheckpoints, ...newCheckpoints }),
			branchRef.child('checkpointMap').set({ ...existingCheckpointMap, ...newCheckpointMap }),
		]);
	}
	return hasCreatedNewCheckpoints;
};

const backfillCheckpointsForPub = (pub) => {
	return Promise.all(
		pub.branches.map((branch) =>
			backfillCheckpointsForBranch(pub.id, branch.id)
				.then((createdCheckpoints) => statusMessage(pub, branch, true, createdCheckpoints))
				.catch((err) => {
					statusMessage(pub, branch, false);
					console.error(err);
				}),
		),
	);
};

const main = async () => {
	const allPubs = await getAllPubsWithBranches();
	console.log('got pubs');
	await Promise.map(allPubs, backfillCheckpointsForPub, { concurrency: 10 });
	console.log('done.');
};

main();
