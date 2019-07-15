/* eslint-disable no-console */
const { freshProblemContext, getProblemContext, error } = require('../problems');
const { createHashMatcher } = require('../util/hash');

const hashMatcher = createHashMatcher('inputsHash', ['firebase-v5.json', 'model.json']);

const { queryPub } = require('./queryPub');
const transformPub = require('./transformPub');
const { getChangesAndCheckpointForPub } = require('./changes');

const getAndWritePubModelJson = async (pubDir, pubId) => {
	console.log('Querying database');
	const updatedModel = await queryPub(pubId);
	pubDir.write('model.json', JSON.stringify(updatedModel));
	return updatedModel;
};

const getAndWritePubFirebaseJson = async (pubDir, pubId, firebaseReader) => {
	console.log('Querying firebase');
	const json = await firebaseReader(pubId);
	pubDir.write('firebase-v5.json', json);
	if (json === 'null') {
		return null;
	}
	return json;
};

const getAndWriteTransformedJson = (pub, pubFirebase, pubDir) => {
	const { changes, checkpoint, draftBranchId } = getChangesAndCheckpointForPub(pubFirebase);
	const transformed = transformPub(pub, {
		changes: changes,
		checkpoint: checkpoint,
		draftBranchId: draftBranchId,
	}).serialize();
	pubDir.write(
		'transformed.json',
		JSON.stringify({
			transformed: transformed,
			updatedAt: Date.now(),
		}),
	);
	hashMatcher.updateHash(pubDir);
};

module.exports = async (storage, pubId, readFromFirebase, { current, total }, bustCache) => {
	console.log(`======== Processing pub ${pubId} (${current}/${total}) ========`);
	freshProblemContext();
	const pubDir = storage.within(`pubs/${pubId}`);
	pubDir.rm('problems.json');
	const pubModel = await getAndWritePubModelJson(pubDir, pubId);
	const pubFirebase = await getAndWritePubFirebaseJson(pubDir, pubId, readFromFirebase);
	if (bustCache || !hashMatcher.matchHash(pubDir)) {
		if (pubModel && pubFirebase) {
			console.log('Found pub at', pubId);
			try {
				getAndWriteTransformedJson(pubModel, pubFirebase, pubDir);
			} catch (err) {
				if (!err.isLoggedProblem) {
					error(err);
				}
			} finally {
				const problemContext = getProblemContext();
				if (problemContext) {
					if (problemContext.errors.length) {
						console.log('COMPLETED with errors');
					} else if (problemContext.warnings.length) {
						console.log('COMPLETED with warnings');
					}
					pubDir.write('problems.json', JSON.stringify(problemContext));
				} else {
					console.log('COMPLETED');
				}
			}
			return true;
		}
		console.log('Missing pub at', pubId);
		return false;
	}
	console.log(
		'Already wrote transformed.json for these inputs, skipping. Use --bust-cache to force.',
	);
	return false;
};
