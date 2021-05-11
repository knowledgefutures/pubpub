import uuid from 'uuid/v4';
import { Step, Transform } from 'prosemirror-transform';

import { createFirebaseChange, getFirebaseDoc, editorSchema } from 'client/components/Editor';
import { getPubDraftRef, getDatabaseRef } from 'server/utils/firebaseAdmin';

type EditorSchema = typeof editorSchema;
type TransformFn = (t: Transform<EditorSchema>, s: EditorSchema) => void;
type Reference = firebase.database.Reference;

export const editFirebaseDraftByRef = async (ref: Reference) => {
	const fetchDoc = async () => getFirebaseDoc(ref, editorSchema);

	let { doc, key: currentKey } = await fetchDoc();
	let pendingSteps: Step[] = [];

	const api = {
		transform: (fn: TransformFn) => {
			const tr = new Transform(doc);
			fn(tr, editorSchema);
			doc = tr.doc;
			pendingSteps.push(...tr.steps);
			return api;
		},
		writeChange: async () => {
			const change = createFirebaseChange(pendingSteps, 'stubstub-firebase');
			await ref.child(`changes/${currentKey + 1}`).set(change);
			++currentKey;
			pendingSteps = [];
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

export const editFirebaseDraft = (refKey: string = uuid()) => {
	return editFirebaseDraftByRef(getDatabaseRef(refKey)!);
};

export const editPub = async (pubId: string) => {
	const draftRef = await getPubDraftRef(pubId);
	return editFirebaseDraftByRef(draftRef);
};
