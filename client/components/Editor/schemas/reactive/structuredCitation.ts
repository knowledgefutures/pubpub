import { Node } from 'prosemirror-model';
import { useState, useDocumentState, useEffect } from '@pubpub/prosemirror-reactive';

export const structuredCitation = (structuredAttr: string) => {
	return (node: Node) => {
		const { [structuredAttr]: value, customLabel } = node.attrs;
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
