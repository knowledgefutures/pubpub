import type { DocJson } from 'types';

import { Fragment, Node } from 'prosemirror-model';

import { editorSchema, isEmptyDoc, jsonToNode } from 'client/components/Editor';
import { editFirebaseDraftByRef, getPubDraftDoc, getPubDraftRef } from 'server/utils/firebaseAdmin';

export const appendAbstractToPubDraft = async (pubId: string, abstract: null | DocJson) => {
	if (abstract && !isEmptyDoc(abstract)) {
		const pubDraftRef = await getPubDraftRef(pubId);
		const currentState = await getPubDraftDoc(pubId, null);
		const currentDoc = Node.fromJSON(editorSchema, currentState.doc);
		const editor = await editFirebaseDraftByRef(pubDraftRef, 'submissions', editorSchema, {
			doc: currentDoc,
			key: currentState.mostRecentRemoteKey,
		});
		editor.transform((tr, schema) => {
			const abstractNode = jsonToNode(abstract, schema);
			const h1Node = schema.node('heading', { level: 1 }, schema.text('Abstract'));
			const frag = Fragment.from(h1Node).append(abstractNode.content);
			tr.insert(0, frag);
		});
		const committed = await editor.writeChange();
		if (!committed) {
			// Someone may be editing the document...
			throw new Error('Failed to append abstract!');
		}
	}
};
