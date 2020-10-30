import { getReactedCopyOfNode } from '@pubpub/prosemirror-reactive';
import { IconName } from '@blueprintjs/core';
import { Node } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';

import { NodeLabelMap, ReferenceableNodeType } from '../types';

export type NodeReference = {
	node: Node;
	icon: IconName;
	label: string;
};

export const nodeDefaults = {
	[ReferenceableNodeType.Image]: { icon: 'media', text: 'Image' },
	[ReferenceableNodeType.Video]: { icon: 'media', text: 'Video' },
	[ReferenceableNodeType.Audio]: { icon: 'media', text: 'Audio' },
	[ReferenceableNodeType.Table]: { icon: 'th', text: 'Table' },
	[ReferenceableNodeType.BlockEquation]: { icon: 'function', text: 'Equation' },
};

export const buildLabel = (node: Node, customBlockName?: string) => {
	const {
		attrs: { count, label },
		type: { name },
	} = node;

	if (!(count || label)) {
		return null;
	}

	const defaults = nodeDefaults[name];

	if (defaults) {
		return `${customBlockName || label || defaults.name} ${count}`;
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
			name: nodeType,
			spec: { reactive },
		},
	} = node;

	if (!reactive) {
		return null;
	}

	const label = nodeLabels[nodeType as ReferenceableNodeType];
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
		icon: icon,
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

export const getDefaultNodeLabels = (pub: any): NodeLabelMap => {
	const nodeLabelDefaults = Object.entries(nodeDefaults).reduce(
		(acc, [nodeType, { text }]) => ({
			...acc,
			[nodeType]: {
				enabled: false,
				text: text,
			},
		}),
		{} as NodeLabelMap,
	);

	return Object.assign(nodeLabelDefaults, pub.nodeLabels);
};

export const getNodeLabelText = (node: Node, nodeLabels: NodeLabelMap) =>
	nodeLabels[node.type.name as ReferenceableNodeType]?.text;

export const isNodeLabelEnabled = (node: Node, nodeLabels: NodeLabelMap) =>
	Boolean(nodeLabels[node.type.name as ReferenceableNodeType]?.enabled) && !node.attrs.hideLabel;
