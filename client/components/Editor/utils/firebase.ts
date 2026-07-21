import type { Node } from 'prosemirror-model';
import type { Step } from 'prosemirror-transform';

import type { CompressedChange, CompressedKeyable } from '../types';

import { compressStepJSON } from 'prosemirror-compress-pubpub';
import uuid from 'uuid';

import { apiFetch } from 'client/utils/apiFetch';

export const firebaseTimestamp = { '.sv': 'timestamp' };

/**
 * Store a checkpoint by writing the doc to Postgres via the server API.
 * Firebase checkpoints are no longer written — Postgres is the single
 * source of truth for checkpoints.
 */
export const storeCheckpoint = async (pubId: string, doc: Node, keyNumber: number) => {
	try {
		await apiFetch.post('/api/draftCheckpoint', {
			pubId,
			historyKey: keyNumber,
			doc: doc.toJSON(),
		});
	} catch (err) {
		// Non-fatal: the checkpoint is an optimization, not required for correctness.
		// The next checkpoint attempt (100 steps later) will try again.
		console.error('Failed to store checkpoint:', err);
	}
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

/** @deprecated legacy firebase utility */
export const getFirebaseConnectionMonitorRef = (ref: any) => {
	return ref.root.child('.info/connected');
};
