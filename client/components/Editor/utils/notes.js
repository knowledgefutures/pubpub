export const getNotes = (doc) => {
	const citationCounts = {}; /* counts is an object with items of the following form. { citationHtml: { count: citationCount, value: citationValue } } */
	const footnoteItems = [];
	const citationItems = [];

	doc.nodesBetween(0, doc.nodeSize - 2, (node) => {
		if (node.type.name === 'footnote') {
			footnoteItems.push({
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
