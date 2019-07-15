/* eslint-disable no-restricted-syntax, no-continue */

function* generateBisections(searchSize) {
	let i = 1;
	while (true) {
		yield searchSize - Math.floor(searchSize / i);
		i += 1;
	}
}

const bisectToFindPositions = (
	doc,
	substring,
	boundLeft = 0,
	boundRight = doc.nodeSize - 2,
	anchor = 'left',
) => {
	if (!doc.textContent.includes(substring)) {
		return null;
	}
	const searchSize = boundRight - boundLeft;
	let successfulBounds;
	for (const bisection of generateBisections(searchSize)) {
		const left = anchor === 'left' ? boundLeft : boundRight - bisection;
		const right = anchor === 'right' ? boundRight : boundLeft + bisection;
		if (doc.textBetween(left, right).includes(substring)) {
			successfulBounds = { left: left, right: right };
			break;
		}
	}
	if (successfulBounds) {
		const { left, right } = successfulBounds;
		if (doc.textBetween(left, right) === substring) {
			return { left: left, right: right };
		}
		return bisectToFindPositions(
			doc,
			substring,
			left,
			right,
			anchor === 'left' ? 'right' : 'left',
		);
	}
	throw new Error('Bisection failed; no successful bounds');
};

module.exports = bisectToFindPositions;
