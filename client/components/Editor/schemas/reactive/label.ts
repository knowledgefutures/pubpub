import { useDocumentState } from '@pubpub/prosemirror-reactive';
import { Node } from 'prosemirror-model';

import { isNodeLabelEnabled, getNodeLabelText } from '../../utils';

export const label = () => (node: Node) => {
	const { nodeLabels } = useDocumentState();
	return isNodeLabelEnabled(node, nodeLabels) ? getNodeLabelText(node, nodeLabels) : null;
};
