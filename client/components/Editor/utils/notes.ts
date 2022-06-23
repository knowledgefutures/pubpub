import { Node } from 'prosemirror-model';
import striptags from 'striptags';

import { Note } from 'utils/notes';

export type CitationFingerprintFunction = (node: Node) => string;

export const citationFingerprintStripTags = (node: Node) => {
	const { unstructuredValue, value } = node.attrs;
	const strippedUnstructuredValue = unstructuredValue ? striptags(unstructuredValue) : '';
	return `${value}-${strippedUnstructuredValue}`;
};

export const getNotes = (doc: Node, citationFingerprintFn?: CitationFingerprintFunction) => {
	const citationFingerprints = new Set<unknown>();
	const footnoteItems: Note[] = [];
	const citationItems: Note[] = [];

	doc.nodesBetween(0, doc.nodeSize - 2, (node) => {
		if (node.type.name === 'footnote') {
			footnoteItems.push({
				id: node.attrs.id,
				structuredValue: node.attrs.structuredValue,
				unstructuredValue: node.attrs.value,
			});
		}
		if (node.type.name === 'citation') {
			const { unstructuredValue, value } = node.attrs;
			if (citationFingerprintFn) {
				const citationFingerprint = citationFingerprintFn(node);
				if (citationFingerprints.has(citationFingerprint)) {
					return true;
				}
				citationFingerprints.add(citationFingerprint);
			}
			citationItems.push({
				id: node.attrs.id,
				structuredValue: value,
				unstructuredValue,
			});
		}
		return true;
	});

	return {
		footnotes: footnoteItems,
		citations: citationItems,
	};
};
