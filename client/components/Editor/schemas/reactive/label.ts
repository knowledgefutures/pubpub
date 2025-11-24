import type { Node } from 'prosemirror-model';

import { useDocumentState } from '@pubpub/prosemirror-reactive';

import { getEnabledNodeLabelConfiguration, getNodeLabelText } from '../../utils';

export const label = () => (node: Node) => {
	const { nodeLabels } = useDocumentState();
	return getEnabledNodeLabelConfiguration(node, nodeLabels)
		? getNodeLabelText(node, nodeLabels)
		: null;
};
