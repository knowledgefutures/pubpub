import { CitationStyleKind, CitationInlineStyleKind } from 'utils/citations';

export type StructuredValue = string;

export type RenderedStructuredValue = {
	html: string;
	inline: string;
	error?: boolean;
};

type Note = {
	structuredValue: StructuredValue;
	renderedStructuredValue: RenderedStructuredValue;
};

type Notes = Record<StructuredValue, Note>;

type RenderStructuredValuesFn = (
	structuredValues: StructuredValue[],
	citationStyleKind: CitationStyleKind,
	citationInlineStyleKind: CitationInlineStyleKind,
) => Promise<Record<StructuredValue, RenderedStructuredValue>>;

type NotesCallback = (notes: Notes) => unknown;

type Unsubscribe = () => void;

export class NoteManagerCore {
	callbacks: Set<(Notes) => any>;
	notes: Notes;
	citationStyleKind: CitationStyleKind;
	citationInlineStyleKind: CitationInlineStyleKind;
	renderStructuredValues: RenderStructuredValuesFn;
	constructor(
		renderStructuredValues: RenderStructuredValuesFn,
		citationStyleKind: CitationStyleKind,
		citationInlineStyleKind: CitationInlineStyleKind,
		notes: Notes = {},
	) {
		this.citationStyleKind = citationStyleKind;
		this.citationInlineStyleKind = citationInlineStyleKind;
		this.notes = notes;
		this.callbacks = new Set();
		this.renderStructuredValues = renderStructuredValues;
	}

	subscribe(callback: NotesCallback): Unsubscribe {
		this.callbacks.add(callback);
		return (): void => {
			this.callbacks.delete(callback);
		};
	}

	getRenderedValueSync(structuredValue: StructuredValue): null | RenderedStructuredValue {
		const note = this.notes[structuredValue];
		return note?.renderedStructuredValue || null;
	}

	getRenderedValue(structuredValue: StructuredValue): Promise<null | RenderedStructuredValue> {
		const oldRenderedStructuredValue = this.getRenderedValueSync(structuredValue);
		return oldRenderedStructuredValue
			? Promise.resolve(oldRenderedStructuredValue)
			: this.renderStructuredValues(
					[structuredValue],
					this.citationStyleKind,
					this.citationInlineStyleKind,
			  ).then((renderedStructuredValues) => {
					const renderedStructuredValue = renderedStructuredValues[structuredValue];
					this.notes[structuredValue] = {
						structuredValue,
						renderedStructuredValue,
					};
					this.callbacks.forEach((callback) => callback(this.notes));
					return renderedStructuredValue;
			  });
	}
}
