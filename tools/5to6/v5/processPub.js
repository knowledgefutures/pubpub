/* eslint-disable no-console */
const { freshProblemContext, getProblemContext, error } = require('../problems');

const { queryPub } = require('./queryPub');
const transformPub = require('./transformPub');
const { getChangesAndCheckpointForPub } = require('./changes');

const getAndWritePubModelJson = async (pubDir, pubId, pubUpdatedTimes, bustCache = false) => {
	const queryAndUpdatePub = async () => {
		console.log('querying pub');
		const updatedModel = await queryPub(pubId);
		if (updatedModel) {
			pubDir.write('model.json', JSON.stringify(updatedModel));
		}
		return updatedModel;
	};
	if (pubDir.exists('model.json') && !bustCache) {
		const localModel = JSON.parse(pubDir.read('model.json'));
		const localUpdateTime = localModel.updatedAt && new Date(localModel.updatedAt).getTime();
		const remoteUpdateTime =
			pubUpdatedTimes[pubId] && new Date(pubUpdatedTimes[pubId]).getTime();
		const hasBothTimes = localUpdateTime && remoteUpdateTime;
		if (!hasBothTimes || remoteUpdateTime > localUpdateTime) {
			console.log('Querying pub from database');
			return queryAndUpdatePub();
		}
		console.log('Using cached pub model');
		return localModel;
	}
	return queryAndUpdatePub();
};

const getAndWriteTransformedJson = (pub, pubDir, bustCache = false) => {
	const { changes, checkpoint, draftBranchId } = getChangesAndCheckpointForPub(pubDir);
	const transformAndUpdatePub = () => {
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
	};
	if (pubDir.exists('transformed.json')) {
		const { updatedAt: transformUpdatedTime } = JSON.parse(pubDir.read('transformed.json'));
		const lastChangeToPubTime = Math.max(
			new Date(pub.updatedAt).getTime(),
			changes.reduce((max, change) => Math.max(max, change), 0),
		);
		if (bustCache || !transformUpdatedTime || lastChangeToPubTime > transformUpdatedTime) {
			transformAndUpdatePub();
		} else {
			console.log('Keeping cached version of pub transform');
		}
	} else {
		transformAndUpdatePub();
	}
};

module.exports = async (storage, pubId, pubUpdatedTimes, { current, total }, bustCache) => {
	console.log(`======== Processing pub ${pubId} (${current}/${total}) ========`);
	freshProblemContext();
	const pubDir = storage.within(`pubs/${pubId}`);
	pubDir.rm('problems.json');
	const pub = await getAndWritePubModelJson(pubDir, pubId, pubUpdatedTimes, bustCache);
	if (pub) {
		console.log('Found pub at', pubId);
		try {
			getAndWriteTransformedJson(pub, pubDir, bustCache);
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
	} else {
		console.log('Missing pub at', pubId);
	}
};
