const zipArrays = (first, second) => {
	const length = Math.max(first.length, second.length);
	const firstFilled = [...first, ...new Array(length - first.length).fill(null)];
	const secondFilled = [...second, ...new Array(length - second.length).fill(null)];
	const res = [];
	for (let i = 0; i < length; i++) {
		// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
		res.push([firstFilled[i], secondFilled[i]]);
	}
	return res;
};

export const pathMatchesPattern = (filePath, pattern) => {
	const filePathParts = filePath.split('/');
	const patternParts = pattern.split('/');
	// @ts-expect-error ts-migrate(2488) FIXME: Type 'never' must have a '[Symbol.iterator]()' met... Remove this comment to see the full error message
	return zipArrays(patternParts, filePathParts).every(([pathPart, patternPart]) => {
		if (pathPart === null || patternPart === null) {
			return false;
		}
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'split' does not exist on type 'never'.
		const pathDotSegments = pathPart.split('.');
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'split' does not exist on type 'never'.
		const patternDotSegments = patternPart.split('.');
		return zipArrays(patternDotSegments, pathDotSegments).every(
			// @ts-expect-error ts-migrate(2488) FIXME: Type 'never' must have a '[Symbol.iterator]()' met... Remove this comment to see the full error message
			([pathSegment, patternSegment]) =>
				pathSegment === patternSegment || patternSegment === '*',
		);
	});
};
