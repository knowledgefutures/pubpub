import { Node, Slice } from 'prosemirror-model';

import { editorSchema, jsonToNode } from 'client/components/Editor';
import { editFirebaseDraftByRef, getPubDraftDoc, getPubDraftRef } from 'server/utils/firebaseAdmin';
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
	const { doc } = await getPubDraftDoc(pubId, historyKey);

	// Get the actual current state via the PG-checkpoint-aware path so we know
	// the real document and key. Without this, cold-stored pubs (where Firebase
	// was wiped) would see key=-1 and the restore change would be written at
	// key 0 — far below the checkpoint key — leaving the pub permanently stuck
	// in historical mode.
	const currentState = await getPubDraftDoc(pubId, null);
	const currentDoc = Node.fromJSON(editorSchema, currentState.doc);
	const editor = await editFirebaseDraftByRef(pubDraftRef, userId, editorSchema, {
		doc: currentDoc,
		key: currentState.mostRecentRemoteKey,
	});

	editor.transform((tr, schema) => {
		const currentDoc = editor.getDoc();
		const replacementDoc = jsonToNode(doc, schema);
		tr.replace(0, currentDoc.content.size, new Slice(replacementDoc.content, 0, 0));
	});

	await editor.writeChange();
};
