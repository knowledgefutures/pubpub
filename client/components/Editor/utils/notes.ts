import { Node } from 'prosemirror-model';
import striptags from 'striptags';

import { Note } from 'utils/notes';

export type CitationFingerprintFunction = (node: Node) => string;

const fingerprintNote = (node: Node) => {
	const { unstructuredValue, value } = node.attrs;
	const strippedUnstructuredValue = unstructuredValue ? striptags(unstructuredValue) : '';
	return `${value}-${strippedUnstructuredValue}`;
};

export const getNotesByKindFromDoc = (doc: Node) => {
	const footnoteItems: Note[] = [];
	const citationItems: Note[] = [];

	doc.nodesBetween(0, doc.nodeSize - 2, (node) => {
		const fingerprint = fingerprintNote(node);
		if (node.type.name === 'footnote') {
			const { value, structuredValue } = node.attrs;
			footnoteItems.push({
				id: node.attrs.id,
				unstructuredValue: value,
				structuredValue,
				fingerprint,
			});
		}
		if (node.type.name === 'citation') {
			const { unstructuredValue, value } = node.attrs;
			citationItems.push({
				id: node.attrs.id,
				structuredValue: value,
				unstructuredValue,
				fingerprint,
			});
		}
		return true;
	});

	return {
		footnotes: footnoteItems,
		citations: citationItems,
	};
};
