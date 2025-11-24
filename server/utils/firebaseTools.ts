import type { DocJson } from 'types';

import { Fragment, Node, Slice } from 'prosemirror-model';
import { ReplaceStep } from 'prosemirror-transform';

import { buildSchema, createFirebaseChange } from 'client/components/Editor';

import { getPubDraftDoc, getPubDraftRef } from './firebaseAdmin';

type Reference = Awaited<ReturnType<typeof getPubDraftRef>>;

const documentSchema = buildSchema();

const makeReplaceStepFromTo = ({
	from,
	to,
	slice,
	client = 'api',
}: {
	from: number;
	to: number;
	slice: Slice;
	client?: string;
}) => {
	const replaceStep = new ReplaceStep(from, to, slice);
	const change = createFirebaseChange([replaceStep], client);
	return change;
};

const appendNewChange = async ({
	draftRef,
	from,
	to,
	slice,
	client = 'api',
}: {
	draftRef: Reference;
	from: number;
	to: number;
	slice: Slice;
	client?: string;
}) => {
	const latestChange = (await draftRef.child('changes').limitToLast(1).once('value')).val();

	const latestKey = latestChange ? Object.keys(latestChange)[0] : null;
	const key = latestKey ? Number(latestKey) + 1 : 0;

	const change = makeReplaceStepFromTo({ from, to, slice, client });
	await draftRef.child('changes').child(key.toString()).set(change);
};

export const writeDocumentToPubDraft = async (
	pubId: string,
	document: DocJson,
	options?: { method?: 'replace' | 'overwrite' | 'append' | 'prepend' },
) => {
	const { method = 'replace' } = options || {};
	const draftRef = await getPubDraftRef(pubId);

	const hydratedDocument = Node.fromJSON(documentSchema, document);

	const documentFragment = Fragment.from(hydratedDocument.content);
	const slice = new Slice(documentFragment, 0, 0);

	const doc = hydratedDocument.toJSON() as DocJson;

	const { size, doc: originalDoc } = await getPubDraftDoc(draftRef);
	switch (method) {
		case 'overwrite': {
			const change = makeReplaceStepFromTo({ from: 0, to: 0, slice });
			// this removes the old data
			await draftRef.child('changes').set({ 0: change });
			return doc;
		}
		case 'prepend': {
			appendNewChange({ from: 0, to: 0, slice, draftRef });
			return {
				...originalDoc,
				content: [...doc.content, ...originalDoc.content],
			} as DocJson;
		}
		case 'replace': {
			appendNewChange({ from: 0, to: size, slice, draftRef });
			return doc;
		}

		default: {
			appendNewChange({ from: size, to: size, slice, draftRef });
			return {
				...originalDoc,
				content: [...originalDoc.content, ...doc.content],
			} as DocJson;
		}
	}
};
