import { buildSchema, jsonToNode, getNotes } from 'components/Editor';

import discussionSchema from 'containers/Pub/PubDocument/DiscussionAddon/discussionSchema';
import { getBranchDoc } from '../../../server/utils/firebaseAdmin';
// This fails for now until we touch up the exporter
// eslint-disable-next-line
import { generateCiteHtmls } from '../../../server/editor/queries';

export const getProsemirrorPubData = async (pubId, branchId, historyKey, citationStyle) => {
	const { doc: docJson } = await getBranchDoc(pubId, branchId, historyKey);
	const schema = buildSchema(discussionSchema);
	const doc = jsonToNode(docJson, schema);
	const { footnotes: rawFootnotes, citations: rawCitations } = getNotes(doc);
	const footnotes = await generateCiteHtmls(rawFootnotes, citationStyle);
	const citations = await generateCiteHtmls(rawCitations, citationStyle);
	return { prosemirrorDoc: docJson, footnotes: footnotes, citations: citations };
};
