import admin from 'firebase-admin';
import { Node } from 'prosemirror-model';
import { Step, Transform } from 'prosemirror-transform';
import uuid from 'uuid/v4';

import { createFirebaseChange, getFirebaseDoc } from 'client/components/Editor';
import { Branch } from 'server/models';
import { getBranchRef, getDatabaseRef, editorSchema } from 'server/utils/firebaseAdmin';

type EditorSchema = typeof editorSchema;
type TransformFn = (t: Transform<EditorSchema>, s: EditorSchema) => void;

type Reference = admin.database.Reference;

export const editFirebaseDraftByRef = async (ref: Reference, { branchId = 'no-branch' } = {}) => {
	const fetchDoc = async () => {
		const { key, doc: docJson } = await getFirebaseDoc(ref, editorSchema);
		const doc = Node.fromJSON(editorSchema, docJson);
		return { key: key, doc: doc };
	};

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
			const change = createFirebaseChange(pendingSteps, branchId, 'stubstub-firebase');
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
	const draftBranch = await Branch.findOne({ where: { pubId: pubId, title: 'draft' } });
	const branchRef = getBranchRef(pubId, draftBranch.id)!;
	return editFirebaseDraftByRef(branchRef, { branchId: draftBranch.id });
};
