import { Hooks } from '@pubpub/prosemirror-reactive/dist/store/types';
import { Node } from 'prosemirror-model';
import { NodeLabelMap, ReferenceableNodeType } from '../../types';

import { isNodeLabelEnabled } from '../../utils';

type CounterOptions = {
	counterType?: string;
	useNodeLabels?: boolean;
};

export const counter = (options: CounterOptions = {}, nodeFingerprintFn?) => {
	const hasFingerprint = !!nodeFingerprintFn;

	return function(this: Hooks, node: Node) {
		const { counterType = node.type.name, useNodeLabels = false } = options;
		const { nodeLabels } = this.useDocumentState();

		let resolvedCounterType = counterType;

		if (useNodeLabels) {
			const nodeLabel = (nodeLabels as NodeLabelMap)[node.type.name as ReferenceableNodeType];
			if (!(nodeLabel && isNodeLabelEnabled(node, nodeLabels))) {
				return null;
			}
			resolvedCounterType = nodeLabel.text;
		}

		const counterState = this.useTransactionState(['counter', resolvedCounterType], {
			countsMap: {},
			maxCount: 0,
		});

		if (hasFingerprint) {
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
