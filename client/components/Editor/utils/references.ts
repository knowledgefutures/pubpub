import { getReactedCopyOfNode } from '@pubpub/prosemirror-reactive';
import { IconName } from '@blueprintjs/core';
import { Node } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';

import { Pub } from 'types';

import { referencesPluginKey } from '../plugins/references';
import { NodeLabelMap, ReferenceableNodeType } from '../types';

export type NodeReference = {
	node: Node;
	icon: IconName;
	label: string;
};

const getReferenceableNodeType = (node): ReferenceableNodeType =>
	node.type.name === 'math_display' ? 'block_equation' : node.type.name;

export const nodeDefaults = {
	[ReferenceableNodeType.Image]: { icon: 'media', text: 'Image' },
	[ReferenceableNodeType.Video]: { icon: 'media', text: 'Video' },
	[ReferenceableNodeType.Audio]: { icon: 'media', text: 'Audio' },
	[ReferenceableNodeType.Table]: { icon: 'th', text: 'Table' },
	[ReferenceableNodeType.BlockEquation]: { icon: 'function', text: 'Equation' },
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

export const isNodeLabelEnabled = (node: Node, nodeLabels: NodeLabelMap) => {
	const nodeType = getReferenceableNodeType(node);
	const enabled = nodeLabels[nodeType]?.enabled;
	return node.attrs.hideLabel || !enabled ? null : nodeType;
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
			isNodeLabelEnabled(node, nodeLabels)
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

export const getDefaultNodeLabels = (pub: Pub): NodeLabelMap => {
	const nodeLabelDefaults = Object.entries(nodeDefaults).reduce(
		(acc, [nodeType, { text }]) => ({
			...acc,
			[nodeType]: {
				enabled: false,
				text,
			},
		}),
		{} as NodeLabelMap,
	);

	return Object.assign(nodeLabelDefaults, pub.nodeLabels);
};

export const getNodeLabelText = (node: Node, nodeLabels: NodeLabelMap) => {
	const nodeType = getReferenceableNodeType(node);
	return nodeLabels[nodeType]?.text;
};
