import { apiFetch } from 'client/utils/apiFetch';

const getRenderedCitations = (structuredValues, citationStyle, inlineStyle) =>
	apiFetch.post('/api/editor/citation-format', {
		structuredValues,
		inlineStyle,
		citationStyle,
	});

class CitationManagerEntry {
	constructor(structuredValue, citationStyle, inlineStyle, renderedValue = null) {
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'callbacks' does not exist on type 'Citat... Remove this comment to see the full error message
		this.callbacks = new Set();
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'structuredValue' does not exist on type ... Remove this comment to see the full error message
		this.structuredValue = structuredValue;
		if (renderedValue) {
			this.populate(renderedValue);
		} else {
			getRenderedCitations([structuredValue], citationStyle, inlineStyle).then((result) =>
				this.populate(result[structuredValue]),
			);
		}
	}

	populate(renderedValue) {
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'renderedValue' does not exist on type 'C... Remove this comment to see the full error message
		this.renderedValue = renderedValue;
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'callbacks' does not exist on type 'Citat... Remove this comment to see the full error message
		this.callbacks.forEach((callback) => callback(this.renderedValue));
	}

	subscribe(callback, immediate) {
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'callbacks' does not exist on type 'Citat... Remove this comment to see the full error message
		this.callbacks.add(callback);
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'renderedValue' does not exist on type 'C... Remove this comment to see the full error message
		if (immediate && this.renderedValue) {
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'renderedValue' does not exist on type 'C... Remove this comment to see the full error message
			callback(this.renderedValue);
		}
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'callbacks' does not exist on type 'Citat... Remove this comment to see the full error message
		return () => this.callbacks.delete(callback);
	}

	getSync() {
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'renderedValue' does not exist on type 'C... Remove this comment to see the full error message
		return this.renderedValue;
	}
}

export class CitationManager {
	constructor(citationStyle, inlineStyle, initialEntries = {}) {
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'citationStyle' does not exist on type 'C... Remove this comment to see the full error message
		this.citationStyle = citationStyle;
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'inlineStyle' does not exist on type 'Cit... Remove this comment to see the full error message
		this.inlineStyle = inlineStyle;
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'entries' does not exist on type 'Citatio... Remove this comment to see the full error message
		this.entries = {};
		Object.entries(initialEntries).forEach(([structuredValue, renderedValue]) => {
			this._getOrCreateEntry(structuredValue, renderedValue);
		});
	}

	_getOrCreateEntry(structuredValue, maybeRenderedValue) {
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'entries' does not exist on type 'Citatio... Remove this comment to see the full error message
		if (this.entries[structuredValue]) {
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'entries' does not exist on type 'Citatio... Remove this comment to see the full error message
			return this.entries[structuredValue];
		}
		const entry = new CitationManagerEntry(
			structuredValue,
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'citationStyle' does not exist on type 'C... Remove this comment to see the full error message
			this.citationStyle,
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'inlineStyle' does not exist on type 'Cit... Remove this comment to see the full error message
			this.inlineStyle,
			maybeRenderedValue,
		);
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'entries' does not exist on type 'Citatio... Remove this comment to see the full error message
		this.entries[structuredValue] = entry;
		return entry;
	}

	subscribe(structuredValue, callback, immediate = true) {
		// @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
		return this._getOrCreateEntry(structuredValue).subscribe(callback, immediate);
	}

	getSync(structuredValue) {
		// @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
		return this._getOrCreateEntry(structuredValue).getSync();
	}
}
