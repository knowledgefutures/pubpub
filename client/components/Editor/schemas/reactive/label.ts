import { Hooks } from '@pubpub/prosemirror-reactive/dist/store/types';
import { Node } from 'prosemirror-model';

import { isNodeLabelEnabled, getNodeLabelText } from '../../utils';

export const label = () =>
	function(this: Hooks, node: Node) {
		const { nodeLabels } = this.useDocumentState();

		return isNodeLabelEnabled(node, nodeLabels) ? getNodeLabelText(node, nodeLabels) : null;
	};
