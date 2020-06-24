const zipArrays = (first, second) => {
	const length = Math.max(first.length, second.length);
	const firstFilled = [...first, ...new Array(length - first.length).fill(null)];
	const secondFilled = [...second, ...new Array(length - second.length).fill(null)];
	const res = [];
	for (let i = 0; i < length; i++) {
		res.push([firstFilled[i], secondFilled[i]]);
	}
	return res;
};

export const pathMatchesPattern = (filePath, pattern) => {
	const filePathParts = filePath.split('/');
	const patternParts = pattern.split('/');
	return zipArrays(patternParts, filePathParts).every(([pathPart, patternPart]) => {
		if (pathPart === null || patternPart === null) {
			return false;
		}
		const pathDotSegments = pathPart.split('.');
		const patternDotSegments = patternPart.split('.');
		return zipArrays(patternDotSegments, pathDotSegments).every(
			([pathSegment, patternSegment]) =>
				pathSegment === patternSegment || patternSegment === '*',
		);
	});
};
