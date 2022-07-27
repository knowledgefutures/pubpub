import sanitizeHtml from 'sanitize-html';

import { DocJson, Maybe } from 'types';
import { jsonToNode, getNotesByKindFromDoc } from 'components/Editor';
import { NoteManager } from 'client/utils/notes';
import { getStructuredCitations } from 'server/utils/citations';
import { Note, RenderedStructuredValues } from '../../../utils/notes';

import { NotesData, PubMetadata } from './types';

export type PandocNote = {
	id: string;
	cslJson: Record<string, any>;
	hasStructuredContent: boolean;
	unstructuredHtml: string;
};

export type PandocNotes = Record<string, PandocNote>;

const getCslJsonForNote = (note: Note, renderedStructuredValues: RenderedStructuredValues) => {
	const { id, structuredValue } = note;
	const renderedStructuredValue = structuredValue
		? renderedStructuredValues[structuredValue]
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
		cslJson: { id },
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
	const { footnotes, citations } = getNotesByKindFromDoc(hydratedPubDoc);

	const structuredValues = [
		...new Set([...footnotes, ...citations].map((note) => note.structuredValue)),
	];
	const renderedStructuredValues = await getStructuredCitations(
		structuredValues,
		citationStyle,
		citationInlineStyle,
	);

	return {
		citations,
		footnotes,
		renderedStructuredValues,
		noteManager: new NoteManager(citationStyle, citationInlineStyle, renderedStructuredValues),
	};
};

export const getPandocNotesById = (notesData: NotesData): PandocNotes => {
	const { citations, footnotes, renderedStructuredValues } = notesData;
	const notes = [...citations, ...footnotes];
	const index: PandocNotes = {};
	notes.forEach((note) => {
		const { hasStructuredContent, cslJson } = getCslJsonForNote(note, renderedStructuredValues);
		index[note.id] = {
			id: getIdForNote(cslJson, note.id),
			cslJson,
			hasStructuredContent,
			unstructuredHtml: note.unstructuredValue,
		};
	});
	return index;
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
