import type { DocJson } from 'types';

import { Fragment, Node, Slice } from 'prosemirror-model';

import { buildSchema } from 'client/components/Editor/utils';

import { editDraft, getPubDraftDoc } from './firebaseAdmin';

const documentSchema = buildSchema();

export const writeDocumentToPubDraft = async (
	pubId: string,
	document: DocJson,
	options?: { method?: 'replace' | 'overwrite' | 'append' | 'prepend' },
) => {
	const { method = 'replace' } = options || {};

	const hydratedDocument = Node.fromJSON(documentSchema, document);
	const documentFragment = Fragment.from(hydratedDocument.content);
	const slice = new Slice(documentFragment, 0, 0);
	const doc = hydratedDocument.toJSON() as DocJson;

	const { size, doc: originalDoc } = await getPubDraftDoc(pubId, null);

	const editor = await editDraft(pubId, 'api', documentSchema);

	switch (method) {
		case 'overwrite':
		case 'replace': {
			editor.transform((tr) => {
				tr.replace(0, size, slice);
			});
			await editor.writeChange();
			return doc;
		}

		case 'prepend': {
			editor.transform((tr) => {
				tr.replace(0, 0, slice);
			});
			await editor.writeChange();
			return {
				...originalDoc,
				content: [...doc.content, ...originalDoc.content],
			} as DocJson;
		}

		default: {
			editor.transform((tr) => {
				tr.replace(size, size, slice);
			});
			await editor.writeChange();
			return {
				...originalDoc,
				content: [...originalDoc.content, ...doc.content],
			} as DocJson;
		}
	}
};
