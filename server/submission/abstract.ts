import type { DocJson } from 'types';

import { Fragment } from 'prosemirror-model';

import { editorSchema, isEmptyDoc, jsonToNode } from 'client/components/Editor/utils';
import { editDraft } from 'server/utils/firebaseAdmin';

export const appendAbstractToPubDraft = async (pubId: string, abstract: null | DocJson) => {
	if (abstract && !isEmptyDoc(abstract)) {
		const editor = await editDraft(pubId, 'submissions', editorSchema);

		editor.transform((tr, schema) => {
			const abstractNode = jsonToNode(abstract, schema);
			const h1Node = schema.node('heading', { level: 1 }, schema.text('Abstract'));
			const frag = Fragment.from(h1Node).append(abstractNode.content);
			tr.insert(0, frag);
		});

		const committed = await editor.writeChange();

		if (!committed) {
			throw new Error('Failed to append abstract!');
		}
	}
};
