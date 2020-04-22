import { importDocJson, getNotes } from 'components/Editor';

export const importDocToEditor = (prosemirrorView, docJson, updateLocalData) => {
	const doc = importDocJson(prosemirrorView, docJson);
	const { footnotes, citations } = getNotes(doc);
	setTimeout(() => updateLocalData('pub', { footnotes: footnotes, citations: citations }));
};
