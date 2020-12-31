type Note = {
	id: string;
	structuredValue: string;
	unstructuredValue: string;
};

export const getNotes = (doc) => {
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
			const key = `${node.attrs.value}-${node.attrs.unstructuredValue}`;
			const existingCount = citationCounts[key];
			if (!existingCount) {
				citationCounts[key] = true;
				citationItems.push({
					id: node.attrs.id,
					structuredValue: node.attrs.value,
					unstructuredValue: node.attrs.unstructuredValue,
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
