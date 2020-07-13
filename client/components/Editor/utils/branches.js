import { flattenKeyables, storeCheckpoint } from './firebase';
import { getFirebaseDoc } from './firebaseDoc';

export const createBranch = (baseFirebaseRef, newFirebaseRef, versionNumber) => {
	const getChanges = baseFirebaseRef
		.child('changes')
		.orderByKey()
		.startAt(String(0))
		.endAt(String(versionNumber))
		.once('value');
	const getMerges = baseFirebaseRef
		.child('merges')
		.orderByKey()
		.startAt(String(0))
		.endAt(String(versionNumber))
		.once('value');
	return Promise.all([getChanges, getMerges]).then(([changesSnapshot, mergesSnapshot]) => {
		const changesSnapshotVal = changesSnapshot.val() || {};
		const mergesSnapshotVal = mergesSnapshot.val() || {};
		const allKeyables = { ...changesSnapshotVal, ...mergesSnapshotVal };
		const flattenedMergeStepArray = flattenKeyables(allKeyables);
		return newFirebaseRef.set({
			lastMergeKey: 0,
			merges: { 0: flattenedMergeStepArray },
		});
	});
};

export const mergeBranch = async (sourceFirebaseRef, destinationFirebaseRef, prosemirrorSchema) => {
	const mergesSnapshot = await destinationFirebaseRef
		.child('merges')
		.orderByKey()
		.startAt(String(0))
		.once('value');

	const mergesSnapshotVal = mergesSnapshot.val() || {};
	const numKeyables = Object.values(mergesSnapshotVal).reduce(
		(count, merge) => count + merge.length,
		0,
	);
	const nextMergeKey = Object.values(mergesSnapshotVal).length;
	const changesSnapshot = await sourceFirebaseRef
		.child('changes')
		.orderByKey()
		.startAt(String(numKeyables))
		.once('value');
	const changesSnapshotVal = changesSnapshot.val();

	const hasChanges = changesSnapshotVal && Object.values(changesSnapshotVal).length;
	if (!hasChanges) {
		return null;
	}

	const setLastMergeKey = destinationFirebaseRef.child('lastMergeKey').set(nextMergeKey);
	const appendMerge = destinationFirebaseRef
		.child('merges')
		.child(nextMergeKey)
		.set(Object.values(changesSnapshotVal));
	await Promise.all([setLastMergeKey, appendMerge]);

	const sourceKey = Object.keys(changesSnapshotVal)
		.map((key) => parseInt(key, 10))
		.reduce((a, b) => Math.max(a, b), -1);
	const { doc } = await getFirebaseDoc(sourceFirebaseRef, prosemirrorSchema, sourceKey);
	await storeCheckpoint(destinationFirebaseRef, doc, nextMergeKey);

	return { mergeKey: nextMergeKey };
};
