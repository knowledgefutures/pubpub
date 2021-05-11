import { jsonToNode, getNotes } from 'components/Editor';
import { NoteManager } from 'client/utils/notes';
import { getStructuredCitations } from 'server/utils/citations';

const enrichNoteWithStructuredResult = (note, renderedStructuredValues) => {
	const { structuredValue } = note;
	if (structuredValue && renderedStructuredValues[structuredValue]) {
		const { html } = renderedStructuredValues[structuredValue];
		return { ...note, structuredHtml: html };
	}
	return note;
};

export const getNotesData = async (pubData, pubDoc) => {
	const { citationStyle, citationInlineStyle } = pubData;
	const hydratedPubDoc = jsonToNode(pubDoc);
	const { footnotes, citations } = getNotes(hydratedPubDoc);

	const structuredValues = [
		...new Set([...footnotes, ...citations].map((note) => note.structuredValue)),
	];

	const renderedStructuredValues = await getStructuredCitations(
		structuredValues,
		citationStyle,
		citationInlineStyle,
	);

	return {
		noteManager: new NoteManager(citationStyle, citationInlineStyle, renderedStructuredValues),
		footnotes: footnotes.map((note) =>
			enrichNoteWithStructuredResult(note, renderedStructuredValues),
		),
		citations: citations.map((note) =>
			enrichNoteWithStructuredResult(note, renderedStructuredValues),
		),
	};
};
