import { Slice } from 'prosemirror-model';

import { editFirebaseDraftByRef, getPubDraftDoc, getPubDraftRef } from 'server/utils/firebaseAdmin';
import { jsonToNode } from 'client/components/Editor';
import { assert } from 'utils/assert';

type RestorePubOptions = {
	pubId: string;
	historyKey: number;
	userId: string;
};

export const restorePubDraftToHistoryKey = async (options: RestorePubOptions) => {
	const { pubId, userId, historyKey } = options;
	assert(typeof historyKey === 'number' && historyKey >= 0);
	const pubDraftRef = await getPubDraftRef(pubId);
	const { doc } = await getPubDraftDoc(pubDraftRef, historyKey);
	const editor = await editFirebaseDraftByRef(pubDraftRef, userId);

	editor.transform((tr, schema) => {
		const currentDoc = editor.getDoc();
		const replacementDoc = jsonToNode(doc, schema);
		tr.replace(0, currentDoc.content.size, new Slice(replacementDoc.content, 0, 0));
	});

	await editor.writeChange();
};
