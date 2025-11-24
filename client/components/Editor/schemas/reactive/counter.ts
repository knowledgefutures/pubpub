import type { Node } from 'prosemirror-model';

import { useDocumentState, useTransactionState } from '@pubpub/prosemirror-reactive';

import { getEnabledNodeLabelConfiguration } from '../../utils';

type CounterOptions = {
	counterType?: string;
	useNodeLabels?: boolean;
	nodeFingerprintFn?: (node: Node) => any;
};

export const counter = (options: CounterOptions = {}) => {
	return (node: Node) => {
		const { counterType = node.type.name, useNodeLabels = false, nodeFingerprintFn } = options;
		const { nodeLabels } = useDocumentState();

		let resolvedCounterType = counterType;

		if (useNodeLabels) {
			const nodeLabelConfiguration = getEnabledNodeLabelConfiguration(node, nodeLabels);
			if (nodeLabelConfiguration) {
				resolvedCounterType =
					// Use the node label text, enabling cross-node type label counting
					nodeLabelConfiguration.nodeLabel.text ||
					// Fall back to the default node type
					nodeLabelConfiguration.referenceableNodeType;
			} else {
				return null;
			}
		}

		// biome-ignore lint/correctness/useHookAtTopLevel: shhhhhh
		const counterState = useTransactionState(['counter', resolvedCounterType], {
			countsMap: {},
			maxCount: 0,
		});

		if (nodeFingerprintFn) {
			const fingerprint = JSON.stringify(nodeFingerprintFn(node));
			if (!counterState.countsMap[fingerprint]) {
				counterState.maxCount++;
				counterState.countsMap[fingerprint] = counterState.maxCount;
			}
			return counterState.countsMap[fingerprint];
		}

		counterState.maxCount++;

		return counterState.maxCount;
	};
};
