import md5 from 'crypto-js/md5';
import { callPandoc } from '@pubpub/prosemirror-pandoc';

import { DocJson, Maybe } from 'types';
import { jsonToNode, getNotes, Note } from 'components/Editor';
import { NoteManager } from 'client/utils/notes';
import { getStructuredCitations } from 'server/utils/citations';
import { RenderedStructuredValues } from 'utils/notesCore';

import { NotesData, NoteWithStructuredHtml, PubMetadata } from './types';

export type PandocNote = Note & {
	id: string;
	hash: string;
	html: null | string;
	cslJson: Record<string, any>;
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

const getPlainUnstructuredTextForNote = (note: Note): null | string => {
	if (note.unstructuredValue) {
		return callPandoc(note.unstructuredValue, 'html', 'plain').trim();
	}
	return null;
};

const getCslJsonForNote = (
	note: Note,
	hash: string,
	renderedStructuredValues: RenderedStructuredValues,
) => {
	const renderedStructuredValue = note.structuredValue
		? renderedStructuredValues[note.structuredValue]
		: null;
	const unstructuredValue = getPlainUnstructuredTextForNote(note);
	const custom = unstructuredValue ? { note: unstructuredValue } : {};
	if (renderedStructuredValue) {
		const cslJson = renderedStructuredValue?.json[0];
		if (cslJson) {
			// Citation.js leaves a _graph property on here -- it's noise we don't need to expose
			const normalizedCslJson = { ...cslJson, _graph: undefined };
			return {
				...normalizedCslJson,
				...custom,
			};
		}
	}
	return {
		id: hash,
		...custom,
	};
};

const getHtmlForNote = (
	note: Note,
	renderedStructuredValues: RenderedStructuredValues,
): null | string => {
	const renderedStructuredValue = note.structuredValue
		? renderedStructuredValues[note.structuredValue]
		: null;
	if (renderedStructuredValue) {
		return renderedStructuredValue.html;
	}
	return null;
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

export const getPandocNotesByHash = (
	notes: Note[],
	renderedStructuredValues: RenderedStructuredValues,
): PandocNotes => {
	const index: PandocNotes = {};
	notes.forEach((note) => {
		const hash = getHashForNote(note);
		const cslJson = getCslJsonForNote(note, hash, renderedStructuredValues);
		const html = getHtmlForNote(note, renderedStructuredValues);
		const id = getIdForNote(cslJson, hash);
		index[hash] = { ...note, id, hash, html, cslJson };
	});
	return index;
};

export const getCslJsonForPandocNotes = (notes: PandocNotes) => {
	return Object.values(notes).map((note) => note.cslJson);
};
