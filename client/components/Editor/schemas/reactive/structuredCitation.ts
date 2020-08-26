/* eslint-disable react-hooks/rules-of-hooks */

export const structuredCitation = (structuredAttr) => {
	return function(node) {
		const { [structuredAttr]: value, customLabel } = node.attrs;
		// @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
		const { useEffect, useState, useDocumentState } = this;
		const { citationManager } = useDocumentState();
		const shouldDeriveCitation = !!citationManager;

		const [citation, setCitation] = useState(
			() => shouldDeriveCitation && citationManager.getSync(value),
		);

		useEffect(() => {
			if (shouldDeriveCitation) {
				const unsubscribe = citationManager.subscribe(value, setCitation);
				return unsubscribe;
			}
			return () => {};
		}, [citationManager, customLabel, shouldDeriveCitation, value]);

		return citation;
	};
};
