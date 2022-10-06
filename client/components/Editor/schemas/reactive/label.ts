import { useDocumentState } from '@pubpub/prosemirror-reactive';
import { Node } from 'prosemirror-model';

import { getEnabledNodeLabelConfiguration, getNodeLabelText } from '../../utils';

export const label = () => (node: Node) => {
	const { nodeLabels } = useDocumentState();
	return getEnabledNodeLabelConfiguration(node, nodeLabels)
		? getNodeLabelText(node, nodeLabels)
		: null;
};
