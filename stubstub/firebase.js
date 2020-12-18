import { Node } from 'prosemirror-model';
import { Transform } from 'prosemirror-transform';

import { createFirebaseChange, getFirebaseDoc } from 'client/components/Editor';
import { Branch } from 'server/models';
import { getBranchRef, editorSchema } from 'server/utils/firebaseAdmin';

export const editPub = async (pubId) => {
	const draftBranch = await Branch.findOne({ where: { pubId: pubId, title: 'draft' } });
	const branchRef = getBranchRef(pubId, draftBranch.id);
	const firebaseDocInfo = await getFirebaseDoc(branchRef, editorSchema);
	let doc = Node.fromJSON(editorSchema, firebaseDocInfo.doc);
	let currentKey = firebaseDocInfo.key;
	let pendingSteps = [];

	const api = {
		transform: (fn) => {
			const tr = new Transform(doc);
			fn(tr, editorSchema);
			doc = tr.doc;
			pendingSteps.push(...tr.steps);
			return api;
		},
		writeChange: async () => {
			const change = createFirebaseChange(pendingSteps, draftBranch.id, 'stubstub-firebase');
			await branchRef.child(`changes/${currentKey + 1}`).set(change);
			++currentKey;
			pendingSteps = [];
		},
		clearChanges: async () => {
			await branchRef.child(`changes`).remove();
			pendingSteps = [];
			currentKey = -1;
		},
		getDoc: () => {
			return doc;
		},
		getKey: () => {
			return currentKey;
		},
	};

	return api;
};
