export const structuredCitation = (structuredAttr) => {
	return function(node) {
		const { [structuredAttr]: value, customLabel } = node.attrs;
		// @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
		const { useEffect, useState, useDocumentState } = this;
		const { noteManager } = useDocumentState();
		const shouldDeriveCitation = !!noteManager;

		const [note, setNote] = useState(
			() => shouldDeriveCitation && noteManager.getRenderedValueSync(value),
		);

		useEffect(() => {
			if (shouldDeriveCitation) {
				noteManager.getRenderedValue(value).then(setNote);
			}
		}, [noteManager, value, shouldDeriveCitation, customLabel]);

		return note;
	};
};
