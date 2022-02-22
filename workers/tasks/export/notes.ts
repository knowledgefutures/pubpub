import md5 from 'crypto-js/md5';
import sanitizeHtml from 'sanitize-html';

import { DocJson, Maybe } from 'types';
import { jsonToNode, getNotes, Note } from 'components/Editor';
import { NoteManager } from 'client/utils/notes';
import { getStructuredCitations } from 'server/utils/citations';
import { RenderedStructuredValues } from 'utils/notesCore';
import { PandocTarget } from 'utils/export/formats';

import { NotesData, NoteWithStructuredHtml, PubMetadata } from './types';

export type PandocNote = Note & {
	id: string;
	hash: string;
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

const getCslJsonForNote = (
	note: Note,
	hash: string,
	renderedStructuredValues: RenderedStructuredValues,
) => {
	const renderedStructuredValue = note.structuredValue
		? renderedStructuredValues[note.structuredValue]
		: null;
	if (renderedStructuredValue) {
		const cslJson = renderedStructuredValue?.json[0];
		if (cslJson) {
			// Citation.js leaves a _graph property on here -- it's noise we don't need to expose
			return { hasStructuredContent: true, cslJson: { ...cslJson, _graph: undefined } };
		}
	}
	return { hasStructuredContent: false, cslJson: { id: hash } };
};

const getIdForNote = (cslJson: Maybe<Record<string, any>>, hash: string): string => {
	if (cslJson) {
		const { id: providedId, 'citation-label': citationLabel } = cslJson;
		return citationLabel || providedId;
	}
	return hash;
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

export const getHashForNote = (note: Pick<Note, 'structuredValue' | 'unstructuredValue'>) => {
	const { structuredValue, unstructuredValue } = note;
	const digest = md5(`${structuredValue}__${unstructuredValue}`).toString();
	return digest.slice(0, 8);
};

export const getPandocNotesByHash = (notesData: NotesData): PandocNotes => {
	const { citations, footnotes, renderedStructuredValues } = notesData;
	const notes = [...citations, ...footnotes];
	const index: PandocNotes = {};
	notes.forEach((note) => {
		const hash = getHashForNote(note);
		const { hasStructuredContent, cslJson } = getCslJsonForNote(
			note,
			hash,
			renderedStructuredValues,
		);
		const id = getIdForNote(cslJson, hash);
		index[hash] = {
			...note,
			id,
			hash,
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
	target: PandocTarget,
	notes: PandocNotes,
) => {
	if (target === 'jats_archiving') {
		return documentContent.replace(
			emptyElementCitation,
			(match, id, spaceBefore, spaceAfter) => {
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
			},
		);
	}
	return documentContent;
};
