import type firebase from 'firebase';
import type { Schema } from 'prosemirror-model';

import type { DocJson, PubDraftInfo } from 'types';

import firebaseAdmin from 'firebase-admin';
import { type Step, Transform } from 'prosemirror-transform';

import {
	editorSchema,
	getFirebaseDoc,
	getFirstKeyAndTimestamp,
	getLatestKeyAndTimestamp,
} from 'components/Editor';
import { createFirebaseChange, storeCheckpoint } from 'components/Editor/utils';
import { Draft, Pub } from 'server/models';
import { expect } from 'utils/assert';
import { getFirebaseConfig } from 'utils/editor/firebaseConfig';

const getFirebaseApp = () => {
	if (firebaseAdmin.apps.length > 0) {
		return firebaseAdmin.apps[0];
	}
	if (process.env.NODE_ENV === 'test') {
		if (process.env.FIREBASE_TEST_DB_URL) {
			return firebaseAdmin.initializeApp({ databaseURL: process.env.FIREBASE_TEST_DB_URL });
		}
		return null;
	}
	const serviceAccount = JSON.parse(
		Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 as string, 'base64').toString(),
	);
	// biome-ignore lint/suspicious/noConsole: shhhhhh
	console.log(`Firebase App will use: ${getFirebaseConfig().databaseURL}`);
	return firebaseAdmin.initializeApp(
		{
			credential: firebaseAdmin.credential.cert(serviceAccount),
			databaseURL: getFirebaseConfig().databaseURL,
		},
		'firebase-pub-new',
	);
};

const firebaseApp = getFirebaseApp();
const database = firebaseApp && firebaseApp.database();

export const getDatabaseRef = (key: string): firebase.database.Reference => {
	return database?.ref(key) as unknown as firebase.database.Reference;
};

export const getPubDraftRef = async (pubId: string, sequelizeTransaction: any = null) => {
	const pub = expect(
		await Pub.findOne({
			where: { id: pubId },
			include: [{ model: Draft, as: 'draft' }],
			transaction: sequelizeTransaction,
		}),
	);
	return getDatabaseRef(expect(pub.draft).firebasePath);
};

const maybeAddKeyTimestampPair = (key, timestamp) => {
	if (typeof key === 'number' && key >= 0) {
		return { [key]: timestamp };
	}
	return null;
};

export const getPubDraftDoc = async (
	pubIdOrRef: string | firebase.database.Reference,
	historyKey: null | number = null,
	createMissingCheckpoints = false,
): Promise<PubDraftInfo> => {
	const draftRef = typeof pubIdOrRef === 'string' ? await getPubDraftRef(pubIdOrRef) : pubIdOrRef;
	const [
		{ doc, docIsFromCheckpoint, key: currentKey, timestamp: currentTimestamp, checkpointMap },
		{ timestamp: firstTimestamp, key: firstKey },
		{ timestamp: latestTimestamp, key: latestKey },
	] = await Promise.all([
		getFirebaseDoc(draftRef, editorSchema, historyKey),
		getFirstKeyAndTimestamp(draftRef),
		getLatestKeyAndTimestamp(draftRef),
	]);

	if (!docIsFromCheckpoint && createMissingCheckpoints && currentKey === latestKey) {
		storeCheckpoint(draftRef, doc, latestKey);
	}

	return {
		doc: doc.toJSON() as DocJson,
		size: doc.content.size,
		mostRecentRemoteKey: currentKey,
		firstTimestamp,
		latestTimestamp,
		historyData: {
			timestamps: {
				...checkpointMap,
				...maybeAddKeyTimestampPair(firstKey, firstTimestamp),
				...maybeAddKeyTimestampPair(currentKey, currentTimestamp),
				...maybeAddKeyTimestampPair(latestKey, latestTimestamp),
			},
			currentKey,
			latestKey,
		},
	};
};

export const getLatestKeyInPubDraft = async (pubId: string) => {
	const pubDraftRef = await getPubDraftRef(pubId);
	const { key } = await getLatestKeyAndTimestamp(pubDraftRef!);
	return key;
};

const getFirebaseDraftPathParts = (draftPath: string) => {
	const draftPathMatch = draftPath.match(/drafts\/draft-(.*)/);
	if (draftPathMatch) {
		const draftId = draftPathMatch[1];
		return { draftId: `draft-${draftId}` };
	}
	if (draftPath.includes('/')) {
		const [pubIdPart, branchIdPart] = draftPath.split('/');
		if (pubIdPart.startsWith('pub-') && branchIdPart.startsWith('branch-')) {
			return { pubId: pubIdPart, branchId: branchIdPart };
		}
	}
	return null;
};

export const getFirebaseToken = (
	clientId: string,
	clientData: { canEdit: boolean; canView: boolean; draftPath: string },
) => {
	const { draftPath } = clientData;
	const hasValidPrefix = ['pub-', 'drafts/'].some((prefix) => draftPath.startsWith(prefix));
	if (!hasValidPrefix) {
		throw new Error(
			`Will not create Firebase token for potentially dangerous draft path ${draftPath}`,
		);
	}
	const tokenData = { ...clientData, ...getFirebaseDraftPathParts(draftPath) };
	return firebaseAdmin.auth(firebaseApp!).createCustomToken(clientId, tokenData);
};

export const editFirebaseDraftByRef = async (
	ref: firebase.database.Reference,
	clientId: string,
	schema: Schema = editorSchema,
) => {
	const fetchDoc = async () => getFirebaseDoc(ref, schema);

	let { doc, key: currentKey } = await fetchDoc();
	let pendingSteps: Step[] = [];

	const api = {
		transform: (fn: (tr: Transform, sc: Schema) => void) => {
			const tr = new Transform(doc);
			fn(tr, schema);
			doc = tr.doc;
			pendingSteps.push(...tr.steps);
			return api;
		},
		writeChange: async (): Promise<boolean> => {
			const change = createFirebaseChange(pendingSteps, clientId);
			const { committed } = await ref.child(`changes/${currentKey + 1}`).transaction(
				(existingContent) => {
					if (existingContent) {
						// Don't overwrite -- bail instead
						return undefined;
					}
					return change;
				},
				undefined,
				false,
			);
			if (committed) {
				++currentKey;
				pendingSteps = [];
			}
			return committed;
		},
		clearChanges: async () => {
			await ref.child(`changes`).remove();
			const refetch = await fetchDoc();
			doc = refetch.doc;
			currentKey = refetch.key;
			pendingSteps = [];
		},
		getDoc: () => {
			return doc;
		},
		getKey: () => {
			return currentKey;
		},
		getRef: () => {
			return ref;
		},
	};

	return api;
};
