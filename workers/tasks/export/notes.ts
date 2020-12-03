import { jsonToNode, getNotes } from 'components/Editor';
import { CitationManager } from 'client/utils/citations/citationManager';
import { getStructuredCitations } from 'server/utils/citations';
import { editorSchema } from 'server/utils/firebaseAdmin';

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
	const hydratedPubDoc = jsonToNode(pubDoc, editorSchema);
	const { footnotes, citations } = getNotes(hydratedPubDoc);

	const structuredValues = [
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'structuredValue' does not exist on type ... Remove this comment to see the full error message
		...new Set([...footnotes, ...citations].map((note) => note.structuredValue)),
	];

	const renderedStructuredValues = await getStructuredCitations(
		structuredValues,
		citationStyle,
		citationInlineStyle,
	);

	return {
		citationManager: new CitationManager(
			citationStyle,
			citationInlineStyle,
			renderedStructuredValues,
		),
		footnotes: footnotes.map((note) =>
			enrichNoteWithStructuredResult(note, renderedStructuredValues),
		),
		citations: citations.map((note) =>
			enrichNoteWithStructuredResult(note, renderedStructuredValues),
		),
	};
};
