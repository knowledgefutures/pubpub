import { Node } from 'prosemirror-model';
import striptags from 'striptags';

export type Note = {
	id: string;
	structuredValue: string;
	unstructuredValue: string;
};

export const getNotes = (doc: Node) => {
	const citationCounts = {};
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
			const strippedUnstructuredValue = unstructuredValue ? striptags(unstructuredValue) : '';
			const key = `${value}-${strippedUnstructuredValue}`;
			const existingCount = citationCounts[key];
			if (!existingCount) {
				citationCounts[key] = true;
				citationItems.push({
					id: node.attrs.id,
					structuredValue: value,
					unstructuredValue,
				});
			}
		}
		return true;
	});

	return {
		footnotes: footnoteItems,
		citations: citationItems,
	};
};
