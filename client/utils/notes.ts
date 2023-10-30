import { NoteManagerCore } from 'utils/notesCore';
import { apiFetch } from './apiFetch';

const isClient = typeof window !== 'undefined';

const renderStructuredValues = (structuredValues, citationStyleKind, inlineStyleKind) =>
	isClient
		? apiFetch('/api/editor/citation-format', {
				method: 'POST',
				body: JSON.stringify({
					structuredValues,
					inlineStyleKind,
					citationStyleKind,
				}),
		  })
		: Promise.resolve([]);

export class NoteManager extends NoteManagerCore {
	constructor(citationStyleKind, citationInlineStyleKind, notes) {
		super(renderStructuredValues, citationStyleKind, citationInlineStyleKind, notes);
	}
}
