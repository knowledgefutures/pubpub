import { apiFetch } from 'client/utils/apiFetch';

const getRenderedCitations = (structuredValues, citationStyle, inlineStyle) =>
	apiFetch.post('/api/editor/citation-format', {
		structuredValues: structuredValues,
		inlineStyle: inlineStyle,
		citationStyle: citationStyle,
	});

class CitationManagerEntry {
	constructor(structuredValue, citationStyle, inlineStyle, renderedValue = null) {
		this.callbacks = new Set();
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
		this.renderedValue = renderedValue;
		this.callbacks.forEach((callback) => callback(this.renderedValue));
	}

	subscribe(callback, immediate) {
		this.callbacks.add(callback);
		if (immediate && this.renderedValue) {
			callback(this.renderedValue);
		}
		return () => this.callbacks.delete(callback);
	}

	getSync() {
		return this.renderedValue;
	}
}

export class CitationManager {
	constructor(citationStyle, inlineStyle, initialEntries) {
		this.citationStyle = citationStyle;
		this.inlineStyle = inlineStyle;
		this.entries = {};
		Object.entries(initialEntries).forEach(([structuredValue, renderedValue]) => {
			this._getOrCreateEntry(structuredValue, renderedValue);
		});
	}

	_getOrCreateEntry(structuredValue, maybeRenderedValue) {
		if (this.entries[structuredValue]) {
			return this.entries[structuredValue];
		}
		const entry = new CitationManagerEntry(
			structuredValue,
			this.citationStyle,
			this.inlineStyle,
			maybeRenderedValue,
		);
		this.entries[structuredValue] = entry;
		return entry;
	}

	subscribe(structuredValue, callback, immediate = true) {
		return this._getOrCreateEntry(structuredValue).subscribe(callback, immediate);
	}

	getSync(structuredValue) {
		return this._getOrCreateEntry(structuredValue).getSync();
	}
}
