export const getNotes = (doc) => {
	const citationCounts = {};
	const footnoteItems = [];
	const citationItems = [];

	doc.nodesBetween(0, doc.nodeSize - 2, (node) => {
		if (node.type.name === 'footnote') {
			footnoteItems.push({
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
				id: node.attrs.id,
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
				structuredValue: node.attrs.structuredValue,
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
				unstructuredValue: node.attrs.value,
			});
		}
		if (node.type.name === 'citation') {
			const key = `${node.attrs.value}-${node.attrs.unstructuredValue}`;
			const existingCount = citationCounts[key];
			if (!existingCount) {
				citationCounts[key] = true;
				citationItems.push({
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
					id: node.attrs.id,
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
					structuredValue: node.attrs.value,
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
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
