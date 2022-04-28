import sanitizeHtml from 'sanitize-html';

import { DocJson, Maybe } from 'types';
import { jsonToNode, getNotes, Note } from 'components/Editor';
import { NoteManager } from 'client/utils/notes';
import { getStructuredCitations } from 'server/utils/citations';
import { RenderedStructuredValues } from 'utils/notesCore';

import { NotesData, NoteWithStructuredHtml, PubMetadata } from './types';

export type PandocNote = Note & {
	cslJson: Record<string, any>;
	hasStructuredContent: boolean;
	unstructuredHtml: string;
};

export type PandocNotes = Record<string, PandocNote>;

const enrichNoteWithStructuredResult = (
	note: Note,
	renderedStructuredValues: RenderedStructuredValues,
): NoteWithStructuredHtml => {
	const { structuredValue } = note;
	if (structuredValue && renderedStructuredValues[structuredValue]) {
		const { html } = renderedStructuredValues[structuredValue];
		return { ...note, structuredHtml: html };
	}
	return note;
};

const getCslJsonForNote = (note: Note, renderedStructuredValues: RenderedStructuredValues) => {
	const renderedStructuredValue = note.structuredValue
		? renderedStructuredValues[note.structuredValue]
		: null;
	if (renderedStructuredValue) {
		const cslJson = renderedStructuredValue?.json[0];
		if (cslJson) {
			// Citation.js leaves a _graph property on here -- it's noise we don't need to expose
			return {
				hasStructuredContent: true,
				cslJson: { ...cslJson, _graph: undefined },
			};
		}
	}
	return {
		hasStructuredContent: false,
		cslJson: { id: note.id },
	};
};

const getIdForNote = (cslJson: Maybe<Record<string, any>>, id: string): string => {
	if (cslJson) {
		const { id: providedId, 'citation-label': citationLabel } = cslJson;
		return citationLabel || providedId;
	}
	return id;
};

export const getNotesData = async (
	pubMetadata: PubMetadata,
	pubDoc: DocJson,
): Promise<NotesData> => {
	const { citationStyle, citationInlineStyle } = pubMetadata;
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
		renderedStructuredValues,
		noteManager: new NoteManager(citationStyle, citationInlineStyle, renderedStructuredValues),
		footnotes: footnotes.map((note) =>
			enrichNoteWithStructuredResult(note, renderedStructuredValues),
		),
		citations: citations.map((note) =>
			enrichNoteWithStructuredResult(note, renderedStructuredValues),
		),
	};
};

export const getPandocNotesByHash = (notesData: NotesData): PandocNotes => {
	const { citations, footnotes, renderedStructuredValues } = notesData;
	const notes = [...citations, ...footnotes];
	const index: PandocNotes = {};
	notes.forEach((note) => {
		const { hasStructuredContent, cslJson } = getCslJsonForNote(note, renderedStructuredValues);
		index[note.id] = {
			...note,
			id: getIdForNote(cslJson, note.id),
			cslJson,
			hasStructuredContent,
			unstructuredHtml: note.unstructuredValue,
		};
	});
	return index;
};

export const getCslJsonForPandocNotes = (notes: PandocNotes) => {
	return Object.values(notes).map((note) => note.cslJson);
};

const emptyElementCitation =
	/<ref id="ref-(.+?)">(\s+)<element-citation>\s+<\/element-citation>(\s+)<\/ref>/g;

export const modifyJatsContentToIncludeUnstructuredNotes = (
	documentContent: string,
	notes: PandocNotes,
) => {
	return documentContent.replace(emptyElementCitation, (match, id, spaceBefore, spaceAfter) => {
		const note = notes[id];
		if (note && !note.hasStructuredContent && note.unstructuredHtml) {
			// HTML with just these tags is also valid JATS
			const unstructuredContentAsJats = sanitizeHtml(note.unstructuredHtml, {
				allowedTags: ['bold', 'italic', 'a', 'ext-link'],
				allowedAttributes: {
					'ext-link': ['ext-link-type', 'xlink:title', 'xlink:href'],
				},
				transformTags: {
					em: 'italic',
					strong: 'bold',
					a: (_, { href }) => {
						return {
							tagName: 'ext-link',
							attribs: {
								'ext-link-type': 'uri',
								'xlink:title': 'null',
								'xlink:href': href,
							},
						};
					},
				},
			});
			const content = `<mixed-citation>${unstructuredContentAsJats}</mixed-citation>`;
			return `<ref id="ref-${id}">${spaceBefore}${content}${spaceAfter}</ref>`;
		}
		return match;
	});
};
