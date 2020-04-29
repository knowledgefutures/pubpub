import { flattenKeyables } from './firebase';

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

export const mergeBranch = (sourceFirebaseRef, destinationFirebaseRef) => {
	/* TODO-BRANCH At the moment, this merge simply appends new changes in a merge */
	/* It does not properly handle 'commonAncestor' or any similar */
	/* concept which would be needed for multi-direction merging */
	/* or multi-branch merge trees */
	return destinationFirebaseRef
		.child('merges')
		.orderByKey()
		.startAt(String(0))
		.once('value')
		.then((mergesSnapshot) => {
			const mergesSnapshotVal = mergesSnapshot.val() || {};
			const numKeyables = Object.values(mergesSnapshotVal).reduce((prev, curr) => {
				return prev + curr.length;
			}, 0);
			const nextMergeKey = Object.values(mergesSnapshotVal).length;
			const getSourceChanges = sourceFirebaseRef
				.child('changes')
				.orderByKey()
				.startAt(String(numKeyables))
				.once('value');
			return Promise.all([getSourceChanges, nextMergeKey]);
		})
		.then(([changesSnapshot, nextMergeKey]) => {
			const changesSnapshotVal = changesSnapshot.val() || {};
			if (!Object.values(changesSnapshotVal).length) {
				/* If there are no new changes to add into a merge, simply return */
				return null;
			}
			const setLastMergeKey = destinationFirebaseRef.child('lastMergeKey').set(nextMergeKey);
			const appendMerge = destinationFirebaseRef
				.child('merges')
				.child(nextMergeKey)
				.set(Object.values(changesSnapshotVal));
			return Promise.all([setLastMergeKey, appendMerge]);
		});
};
