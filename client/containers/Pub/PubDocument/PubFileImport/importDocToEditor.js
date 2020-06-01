import { importDocJson, getNotes } from 'components/Editor';

export const importDocToEditor = (prosemirrorView, docJson, updatePubData) => {
	const doc = importDocJson(prosemirrorView, docJson);
	const { footnotes, citations } = getNotes(doc);
	updatePubData({ footnotes: footnotes, citations: citations });
};
