import { getReactedCopyOfNode } from '@pubpub/prosemirror-reactive';
import { IconName } from '@blueprintjs/core';
import { Node } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';

import { referencesPluginKey } from '../plugins/references';
import { NodeLabel, NodeLabelMap, ReferenceableNodeType } from '../types';

export type NodeReference = {
	node: Node;
	icon: IconName;
	label: string;
};

const getReferenceableNodeType = (node: Node): ReferenceableNodeType => {
	const {
		type: { name: nodeType },
	} = node;
	if (nodeType === 'math_display' || nodeType === 'block_equation') {
		return ReferenceableNodeType.Math;
	}
	return nodeType as ReferenceableNodeType;
};

export const nodeDefaults = {
	[ReferenceableNodeType.Image]: { icon: 'media', text: 'Image' },
	[ReferenceableNodeType.Video]: { icon: 'media', text: 'Video' },
	[ReferenceableNodeType.Audio]: { icon: 'media', text: 'Audio' },
	[ReferenceableNodeType.Table]: { icon: 'th', text: 'Table' },
	[ReferenceableNodeType.Math]: { icon: 'function', text: 'Equation' },
} as const;

export const buildLabel = (node: Node, customBlockName?: string) => {
	const {
		attrs: { count, label },
	} = node;

	const nodeType = getReferenceableNodeType(node);

	if (!(count || label)) {
		return null;
	}

	const defaults = nodeDefaults[nodeType];

	if (defaults) {
		return `${customBlockName || label || defaults.text} ${count}`;
	}

	return null;
};

type EnabledNodeLabelConfiguration = {
	referenceableNodeType: ReferenceableNodeType;
	nodeLabel: NodeLabel;
};

export const getEnabledNodeLabelConfiguration = (
	node: Node,
	nodeLabels: NodeLabelMap,
): null | EnabledNodeLabelConfiguration => {
	const showLabel = !node.attrs.hideLabel;
	if (showLabel) {
		const referenceableNodeType = getReferenceableNodeType(node);
		const nodeLabel = nodeLabels[referenceableNodeType];
		if (nodeLabel?.enabled) {
			return { referenceableNodeType, nodeLabel };
		}
	}
	return null;
};

export const getReferenceForNode = (
	node: Node,
	editorState: EditorState,
	nodeLabels: NodeLabelMap,
): NodeReference | null => {
	const {
		type: {
			spec: { reactive },
		},
	} = node;
	const nodeType = getReferenceableNodeType(node);

	if (!reactive) {
		return null;
	}

	const label = nodeLabels[nodeType];
	const defaults = nodeDefaults[nodeType];
	const reactedNode = getReactedCopyOfNode(node, editorState);

	if (
		!(
			defaults &&
			reactedNode &&
			typeof reactedNode.attrs.count === 'number' &&
			label &&
			getEnabledNodeLabelConfiguration(node, nodeLabels)
		)
	) {
		return null;
	}

	const { icon } = defaults;

	return {
		node: reactedNode,
		icon,
		label: buildLabel(reactedNode, label.text)!,
	};
};

export const getReferenceableNodes = (editorState: EditorState, nodeLabels: NodeLabelMap) => {
	const nodes: NodeReference[] = [];

	editorState.doc.descendants((node) => {
		if (node.attrs && node.attrs.id) {
			const reference = getReferenceForNode(node, editorState, nodeLabels);

			if (reference) {
				nodes.push(reference);
			}
		}
	});

	return nodes;
};

export const getCurrentNodeLabels = (state: EditorState): NodeLabelMap => {
	return referencesPluginKey.getState(state).nodeLabels;
};

export const getNodeLabelText = (node: Node, nodeLabels: NodeLabelMap) => {
	const nodeType = getReferenceableNodeType(node);
	return nodeLabels[nodeType]?.text;
};
