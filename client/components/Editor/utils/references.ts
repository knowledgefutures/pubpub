import { getReactedCopyOfNode } from '@pubpub/prosemirror-reactive';
import { IconName } from '@blueprintjs/core';

type ReferenceType = {
	name?: string;
	icon: IconName;
};

export type NodeReference = {
	node: any;
	icon: IconName;
};

export const referenceTypes: { [key: string]: ReferenceType } = {
	image: { icon: 'media', name: 'Image' },
	video: { icon: 'media', name: 'Video' },
	audio: { icon: 'media', name: 'Audio' },
	table: { icon: 'th', name: 'Table' },
	block_equation: { icon: 'function', name: 'Equation' },
};

export const buildLabel = (node, customBlockName?: string) => {
	const {
		attrs: { count, label },
		type: { name },
	} = node;
	const referenceType = referenceTypes[name];

	if (referenceType) {
		return `${customBlockName || label || referenceType.name} ${count}`;
	}

	return null;
};

export const getReferenceForNode = (node, editorState): NodeReference | null => {
	const {
		type: {
			name: nodeType,
			spec: { reactive },
		},
	} = node;

	if (!reactive) {
		return null;
	}

	const referenceType = referenceTypes[nodeType];
	const reactedNode = getReactedCopyOfNode(node, editorState);

	if (!(referenceType && reactedNode && typeof reactedNode.attrs.count === 'number')) {
		return null;
	}

	const { icon } = referenceType;

	return {
		node: reactedNode,
		icon: icon,
	};
};

export const getReferenceableNodes = (editorState) => {
	const nodes: NodeReference[] = [];
	editorState.doc.descendants((node) => {
		if (node.attrs && node.attrs.id) {
			const reference = getReferenceForNode(node, editorState);
			if (reference) {
				nodes.push(reference);
			}
		}
	});
	return nodes;
};
