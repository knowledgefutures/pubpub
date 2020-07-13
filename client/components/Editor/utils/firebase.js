import uuid from 'uuid';
import { compressStateJSON, compressStepJSON } from 'prosemirror-compress-pubpub';

export const firebaseTimestamp = { '.sv': 'timestamp' };

export const storeCheckpoint = async (firebaseRef, docJson, keyNumber) => {
	const checkpoint = {
		d: compressStateJSON({ doc: docJson }).d,
		k: keyNumber,
		t: firebaseTimestamp,
	};
	await Promise.all([
		firebaseRef.child(`checkpoints/${keyNumber}`).set(checkpoint),
		firebaseRef.child('checkpoint').set(checkpoint),
		firebaseRef.child(`checkpointMap/${keyNumber}`).set(firebaseTimestamp),
	]);
};

export const flattenKeyables = (keyables) => {
	/* flattenedMergeStepArray is an array of { steps, client, time } values */
	/* It flattens the case where we have a merge-object which is an array of */
	/* { steps, client, time } values. */
	const objectWithIntKeys = {};
	Object.keys(keyables).forEach((key) => {
		const intKey = parseInt(key, 10);
		objectWithIntKeys[intKey] = keyables[key];
	});
	return Object.keys(objectWithIntKeys)
		.sort((a, b) => a - b)
		.reduce((arr, intKey) => {
			if (Array.isArray(keyables[intKey])) {
				return [...arr, ...keyables[intKey]];
			}
			return [...arr, keyables[intKey]];
		}, []);
};

export const createFirebaseChange = (steps, branchId, clientId) => {
	return {
		id: uuid.v4(), // Keyable Id
		cId: clientId, // Client Id
		bId: branchId, // Origin Branch Id
		s: steps.map((step) => compressStepJSON(step.toJSON())),
		t: firebaseTimestamp,
	};
};
