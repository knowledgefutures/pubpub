import { CitationStyleKind, CitationInlineStyleKind } from 'utils/citations';
import { StructuredValue, RenderedStructuredValue } from 'utils/notes';

type Notes = Record<StructuredValue, RenderedStructuredValue>;

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
		this.notes = { ...notes };
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
		return this.notes[structuredValue] || null;
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
					this.notes[structuredValue] = renderedStructuredValue;
					this.callbacks.forEach((callback) => callback(this.notes));
					return renderedStructuredValue;
			  });
	}
}
