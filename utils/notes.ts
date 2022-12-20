import { unique } from './arrays';
import { CitationInlineStyleKind } from './citations';

export type Note = {
	id: string;
	structuredValue: string;
	unstructuredValue: string;
	fingerprint: string;
};

export type RenderedNote = Note & {
	renderedStructuredValue?: RenderedStructuredValue;
	number?: number;
};

export type StructuredValue = string;

export type RenderedStructuredValue = {
	html: string;
	inline: string;
	error?: boolean;
	json: any;
};

export type RenderedStructuredValues = Record<StructuredValue, RenderedStructuredValue>;

export type ByNoteKind<T> = {
	footnotes: T;
	citations: T;
};

const getAlphabetizableValue = (note: RenderedNote) => {
	const hasRenderedStructuredValue = note.renderedStructuredValue?.json?.length;
	const sortableString = hasRenderedStructuredValue
		? note.renderedStructuredValue?.html
		: note.unstructuredValue;
	return (sortableString || '')
		.replace(/(<([^>]+)>)/gi, '')
		.toLowerCase()
		.trim();
};

type RenderNoteOptions = {
	notes: Note[];
	renderedStructuredValues: RenderedStructuredValues;
	includeNumbers: boolean;
	isFootnote: boolean;
};

const getRenderedNotes = (options: RenderNoteOptions): RenderedNote[] => {
	const { notes, renderedStructuredValues, includeNumbers, isFootnote } = options;
	const notesObject = isFootnote ? notes : unique(notes, (note) => note.fingerprint);
	return notesObject.map((note, index) => {
		return {
			...note,
			...(includeNumbers && { number: index + 1 }),
			renderedStructuredValue: renderedStructuredValues[note.structuredValue],
		};
	});
};

const alphabetizeCitations = (citations: RenderedNote[]) => {
	return citations
		.map((citation) => {
			return {
				...citation,
				sortOn: getAlphabetizableValue(citation),
			};
		})
		.sort((a, b) => a.sortOn.localeCompare(b.sortOn));
};

type RenderForListingOptions = {
	citations: Note[];
	footnotes: Note[];
	citationInlineStyle: CitationInlineStyleKind;
	renderedStructuredValues: RenderedStructuredValues;
};

export const renderNotesForListing = (
	options: RenderForListingOptions,
): ByNoteKind<RenderedNote[]> => {
	const { citations, footnotes, citationInlineStyle, renderedStructuredValues } = options;
	const shouldAlphabetizeCitations = citationInlineStyle !== 'count';
	const renderedFootnotes = getRenderedNotes({
		notes: footnotes,
		renderedStructuredValues,
		includeNumbers: true,
		isFootnote: true,
	});
	const renderedCitations = getRenderedNotes({
		notes: citations,
		renderedStructuredValues,
		includeNumbers: !shouldAlphabetizeCitations,
		isFootnote: false,
	});
	return {
		footnotes: renderedFootnotes,
		citations: shouldAlphabetizeCitations
			? alphabetizeCitations(renderedCitations)
			: renderedCitations,
	};
};
