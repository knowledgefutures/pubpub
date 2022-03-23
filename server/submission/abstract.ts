import { Fragment } from 'prosemirror-model';

import { DocJson } from 'types';
import { isEmptyDoc, jsonToNode } from 'client/components/Editor';
import { editFirebaseDraftByRef, getPubDraftRef } from 'server/utils/firebaseAdmin';

export const appendAbstractToPubDraft = async (pubId: string, abstract: null | DocJson) => {
	if (abstract && !isEmptyDoc(abstract)) {
		const pubDraftRef = await getPubDraftRef(pubId);
		const editor = await editFirebaseDraftByRef(pubDraftRef, 'submissions');
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
