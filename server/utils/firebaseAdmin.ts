import type firebase from 'firebase';
import type { Schema } from 'prosemirror-model';

import type { DocJson, PubDraftInfo } from 'types';

import firebaseAdmin from 'firebase-admin';
import { uncompressStepJSON } from 'prosemirror-compress-pubpub';
import { Node } from 'prosemirror-model';
import { Step, Transform } from 'prosemirror-transform';

import {
	editorSchema,
	getFirebaseDoc,
	getFirstKeyAndTimestamp,
	getLatestKeyAndTimestamp,
} from 'components/Editor';
import { createFirebaseChange, flattenKeyables } from 'components/Editor/utils';
import { getDraftCheckpoint } from 'server/draftCheckpoint/queries';
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

export const getPubDraft = async (pubId: string, sequelizeTransaction: any = null) => {
	const pub = expect(
		await Pub.findOne({
			where: { id: pubId },
			include: [{ model: Draft, as: 'draft' }],
			transaction: sequelizeTransaction,
		}),
	);
	const draft = expect(pub.draft);
	return { draft, draftRef: getDatabaseRef(draft.firebasePath) };
};

const maybeAddKeyTimestampPair = (key, timestamp) => {
	if (typeof key === 'number' && key >= 0) {
		return { [key]: timestamp };
	}
	return null;
};

/**
 * Apply Firebase changes on top of a checkpoint doc to produce the current document.
 * Used when loading from a Postgres checkpoint with Firebase changes layered on top.
 */
const applyFirebaseChangesOnDoc = async (
	draftRef: firebase.database.Reference,
	checkpointDoc: DocJson,
	checkpointKey: number,
	checkpointTimestamp: number | null,
	historyKey: null | number,
) => {
	const versionBound = historyKey ?? Infinity;

	const getChanges = draftRef
		.child('changes')
		.orderByKey()
		.startAt(String(checkpointKey + 1))
		.endAt(String(versionBound))
		.once('value');

	const getMerges = draftRef
		.child('merges')
		.orderByKey()
		.startAt(String(checkpointKey + 1))
		.endAt(String(versionBound))
		.once('value');

	const [changesSnapshot, mergesSnapshot] = await Promise.all([getChanges, getMerges]);

	const allKeyables = {
		...changesSnapshot.val(),
		...mergesSnapshot.val(),
	};

	const flattenedChanges = flattenKeyables(allKeyables);
	const stepsJson = flattenedChanges.flatMap((change) => change.s.map(uncompressStepJSON));

	const keys = Object.keys(allKeyables);
	const currentKey = keys.length
		? keys.map((k) => parseInt(k, 10)).reduce((a, b) => Math.max(a, b))
		: checkpointKey;

	const currentTimestamp =
		flattenedChanges.length > 0
			? flattenedChanges[flattenedChanges.length - 1].t
			: checkpointTimestamp;

	let doc = Node.fromJSON(editorSchema, checkpointDoc);
	for (const stepJson of stepsJson) {
		const step = Step.fromJSON(editorSchema, stepJson);
		const { failed, doc: nextDoc } = step.apply(doc);
		if (failed) {
			console.error(`Failed with: ${failed}`);
		} else if (nextDoc) {
			doc = nextDoc;
		}
	}

	return {
		doc,
		key: currentKey,
		timestamp: currentTimestamp as number,
		hasFirebaseChanges: stepsJson.length > 0,
	};
};

export const getPubDraftDoc = async (
	pubIdOrRef: string | firebase.database.Reference,
	historyKey: null | number = null,
): Promise<PubDraftInfo> => {
	// If called with a raw ref (no pub context), fall back to Firebase-only path
	if (typeof pubIdOrRef !== 'string') {
		return getPubDraftDocFromFirebase(pubIdOrRef, historyKey);
	}

	const pubId = pubIdOrRef;
	const { draft, draftRef } = await getPubDraft(pubId);

	// Always try Postgres checkpoint first — but only if the requested historyKey
	// is at or after the checkpoint. If the user is browsing history before the
	// checkpoint, we need the Firebase path which has older changes/checkpoints.
	const pgCheckpoint = await getDraftCheckpoint(draft.id);
	if (pgCheckpoint && (historyKey === null || historyKey >= pgCheckpoint.historyKey)) {
		// Sequelize returns BIGINT as string — coerce to number for Date use
		const pgTimestamp = pgCheckpoint.timestamp ? Number(pgCheckpoint.timestamp) : null;
		const {
			doc,
			key: currentKey,
			timestamp: currentTimestamp,
		} = await applyFirebaseChangesOnDoc(
			draftRef,
			pgCheckpoint.doc as DocJson,
			pgCheckpoint.historyKey,
			pgTimestamp,
			historyKey,
		);

		// If the checkpoint has frozen discussions (from cold storage), thaw them
		// back into Firebase so the collaborative discussions plugin works.
		if (pgCheckpoint.discussions) {
			const existingDiscussions = await draftRef.child('discussions').once('value');
			if (!existingDiscussions.val()) {
				await draftRef.child('discussions').set(pgCheckpoint.discussions);
			}
		}

		// Gather timestamps for history UI
		const [
			{ timestamp: firstTimestamp, key: firstKey },
			{ timestamp: latestTimestamp, key: latestKey },
		] = await Promise.all([
			getFirstKeyAndTimestamp(draftRef).catch(() => ({
				timestamp: currentTimestamp,
				key: currentKey,
			})),
			getLatestKeyAndTimestamp(draftRef).catch(() => ({
				timestamp: currentTimestamp,
				key: currentKey,
			})),
		]);

		// Use the Postgres checkpoint key as the "first" if Firebase has nothing earlier
		const effectiveFirstKey = firstKey >= 0 ? firstKey : pgCheckpoint.historyKey;
		const effectiveFirstTimestamp = firstKey >= 0 ? firstTimestamp : pgCheckpoint.timestamp;
		const effectiveLatestKey = latestKey >= 0 ? latestKey : currentKey;
		const effectiveLatestTimestamp = latestKey >= 0 ? latestTimestamp : currentTimestamp;

		return {
			doc: doc.toJSON() as DocJson,
			size: doc.content.size,
			mostRecentRemoteKey: currentKey,
			firstTimestamp: effectiveFirstTimestamp as number,
			latestTimestamp: effectiveLatestTimestamp as number,
			historyData: {
				timestamps: {
					...maybeAddKeyTimestampPair(effectiveFirstKey, effectiveFirstTimestamp),
					...maybeAddKeyTimestampPair(currentKey, currentTimestamp),
					...maybeAddKeyTimestampPair(effectiveLatestKey, effectiveLatestTimestamp),
				},
				currentKey,
				latestKey: effectiveLatestKey,
			},
		};
	}

	// No PG checkpoint — fall back to Firebase-only path (legacy drafts)
	return getPubDraftDocFromFirebase(draftRef, historyKey);
};

/**
 * Original Firebase-only path for loading a draft doc.
 */
const getPubDraftDocFromFirebase = async (
	pubIdOrRef: string | firebase.database.Reference,
	historyKey: null | number = null,
): Promise<PubDraftInfo> => {
	const draftRef = typeof pubIdOrRef === 'string' ? await getPubDraftRef(pubIdOrRef) : pubIdOrRef;
	const [
		{ doc, key: currentKey, timestamp: currentTimestamp, checkpointMap },
		{ timestamp: firstTimestamp, key: firstKey },
		{ timestamp: latestTimestamp, key: latestKey },
	] = await Promise.all([
		getFirebaseDoc(draftRef, editorSchema, historyKey),
		getFirstKeyAndTimestamp(draftRef),
		getLatestKeyAndTimestamp(draftRef),
	]);

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
