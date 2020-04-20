import { buildSchema, jsonToNode, getNotes } from '@pubpub/editor';

import discussionSchema from 'containers/Pub/PubDocument/DiscussionAddon/discussionSchema';
import { getBranchDoc } from '../../../server/utils/firebaseAdmin';
import { generateCiteHtmls } from '../../../server/editor/queries';

export const getProsemirrorPubData = async (pubId, branchId, historyKey) => {
	const { doc: docJson } = await getBranchDoc(pubId, branchId, historyKey);
	const schema = buildSchema(discussionSchema);
	const doc = jsonToNode(docJson, schema);
	const { footnotes: rawFootnotes, citations: rawCitations } = getNotes(doc);
	const footnotes = await generateCiteHtmls(rawFootnotes, 'harvard');
	const citations = await generateCiteHtmls(rawCitations, 'harvard');
	return { prosemirrorDoc: docJson, footnotes: footnotes, citations: citations };
};
