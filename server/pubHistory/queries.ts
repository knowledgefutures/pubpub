import { Node, Slice } from 'prosemirror-model';

import { editorSchema, jsonToNode } from 'client/components/Editor/utils';
import { editDraft, getPubDraftDoc } from 'server/utils/firebaseAdmin';
import { assert } from 'utils/assert';

type RestorePubOptions = {
	pubId: string;
	historyKey: number;
	userId: string;
};

export const restorePubDraftToHistoryKey = async (options: RestorePubOptions) => {
	const { pubId, userId, historyKey } = options;
	assert(typeof historyKey === 'number' && historyKey >= 0);

	const { doc } = await getPubDraftDoc(pubId, historyKey);

	const editor = await editDraft(pubId, userId, editorSchema);

	editor.transform((tr, schema) => {
		const currentDoc = editor.getDoc();
		const replacementDoc = jsonToNode(doc, schema);
		tr.replace(0, currentDoc.content.size, new Slice(replacementDoc.content, 0, 0));
	});

	await editor.writeChange();
};
