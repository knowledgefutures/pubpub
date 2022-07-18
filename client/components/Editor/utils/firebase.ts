import { Node } from 'prosemirror-model';
import { Step } from 'prosemirror-transform';
import { compressStateJSON, compressStepJSON } from 'prosemirror-compress-pubpub';
import uuid from 'uuid';
import firebase from 'firebase';

import { CompressedChange, CompressedKeyable } from '../types';

export const firebaseTimestamp = { '.sv': 'timestamp' };

export const storeCheckpoint = async (
	firebaseRef: firebase.database.Reference,
	doc: Node,
	keyNumber: number,
) => {
	const checkpoint = {
		d: compressStateJSON({ doc: doc.toJSON() }).d,
		k: keyNumber,
		t: firebaseTimestamp,
	};
	await Promise.all([
		firebaseRef.child(`checkpoints/${keyNumber}`).set(checkpoint),
		firebaseRef.child('checkpoint').set(checkpoint),
		firebaseRef.child(`checkpointMap/${keyNumber}`).set(firebaseTimestamp),
	]);
};

export const flattenKeyables = (
	keyables: Record<string, CompressedKeyable>,
): CompressedChange[] => {
	const orderedKeys = Object.keys(keyables).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
	return orderedKeys.reduce((changes: CompressedChange[], key: string) => {
		const entry = keyables[key];
		if (Array.isArray(entry)) {
			return [...changes, ...entry];
		}
		return [...changes, entry];
	}, []);
};

export const createFirebaseChange = (
	steps: readonly Step[],
	clientId: string,
): CompressedChange => {
	return {
		id: uuid.v4(), // Keyable Id
		cId: clientId, // Client Id
		s: steps.map((step) => compressStepJSON(step.toJSON())),
		t: firebaseTimestamp,
	};
};

export const getFirebaseConnectionMonitorRef = (ref: firebase.database.Reference) => {
	return ref.root.child('.info/connected');
};
