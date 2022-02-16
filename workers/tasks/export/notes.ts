import md5 from 'crypto-js/md5';
import { callPandoc } from '@pubpub/prosemirror-pandoc';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

import { DocJson, Maybe } from 'types';
import { jsonToNode, getNotes, Note } from 'components/Editor';
import { NoteManager } from 'client/utils/notes';
import { getStructuredCitations } from 'server/utils/citations';
import { RenderedStructuredValues } from 'utils/notesCore';
import { PandocTarget } from 'utils/export/formats';

import { Replacer, Matcher, walkAndReplace } from '../import/transforms/util';
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

const createJatsNotesMatchAndReplacer = (notes: PandocNotes, xmlParser: XMLParser) => {
	const matcher: Matcher<PandocNote> = ({ node, keyPath }) => {
		if (keyPath[keyPath.length - 1] === 'ref-list') {
			const id = node[':@']?.['@id'] as string;
			if (id && id.startsWith('ref-')) {
				const hash = id.slice(4);
				const note = notes[hash];
				if (note && !note.hasStructuredContent && note.unstructuredHtml) {
					return note;
				}
			}
		}
		return null;
	};
	const replacer: Replacer<PandocNote> = ({ match, entry }) => {
		const { unstructuredHtml, hash } = match;
		if (unstructuredHtml) {
			const unstructuredContentAsJats = callPandoc(unstructuredHtml, 'html', 'jats').trim();
			const jatsXml = xmlParser.parse(unstructuredContentAsJats);
			return {
				':@': { '@id': `ref-${hash}` },
				ref: [{ 'mixed-citation': jatsXml }],
			};
		}
		return entry;
	};
	return { matcher, replacer };
};

export const modifyJatsContentToIncludeUnstructuredNotes = (
	documentContent: string,
	target: PandocTarget,
	notes: PandocNotes,
) => {
	if (
		target === 'jats_archiving' &&
		Object.values(notes).some((note) => !note.hasStructuredContent)
	) {
		const xmlOptions = {
			ignoreAttributes: false,
			allowBooleanAttributes: true,
			format: true,
			preserveOrder: true,
			attributeNamePrefix: '@',
		};
		const parser = new XMLParser(xmlOptions);
		const builder = new XMLBuilder(xmlOptions);
		const matchAndReplace = createJatsNotesMatchAndReplacer(notes, parser);
		const tree = parser.parse(documentContent);
		const walked = walkAndReplace(tree, [matchAndReplace]);
		return builder.build(walked);
	}
	return documentContent;
};
