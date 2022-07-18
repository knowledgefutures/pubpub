import { Node } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';

import { Dispatch } from './types';
import { createCommandSpec } from './util';

type AlignmentType = 'left' | 'center' | 'right';
type NodeAlignmentValue = null | 'center' | 'right';

type NodePos = { node: Node; pos: number };

type AlignableNodesResult = {
	alignableNodes: NodePos[];
	sharedAlignmentType: null | AlignmentType;
};

const alignAttr = 'textAlign';
const alignParentTypes = new Set(['doc', 'table_cell', 'table_header', 'blockquote']);

const wrapAlignmentType = (alignment: AlignmentType): NodeAlignmentValue =>
	alignment === 'left' ? null : alignment;

const unwrapAlignmentValue = (value: NodeAlignmentValue): AlignmentType =>
	value === null ? 'left' : value;

const supportsAlignmentOfChildren = (node: Node) => {
	const { name } = node.type;
	return alignParentTypes.has(name);
};

const supportsAlignment = (node: Node) => {
	const { spec } = node.type;
	return spec.attrs && alignAttr in spec.attrs;
};

const getSharedAlignmentType = (nodes: NodePos[]) => {
	const alignmentTypes = nodes.map(({ node }) => unwrapAlignmentValue(node.attrs[alignAttr]));
	const alignmentTypesSet = new Set(alignmentTypes);
	if (alignmentTypesSet.size === 1) {
		return [...alignmentTypesSet][0];
	}
	return null;
};

let alignableNodesCache: null | { state: EditorState; result: AlignableNodesResult } = null;
const getAlignableNodes = (state: EditorState): AlignableNodesResult => {
	if (alignableNodesCache?.state === state) {
		// Cheap way to cache the results of this function, which will be called several times
		// per EditorState during a given transaction.
		return alignableNodesCache.result;
	}
	const { selection, doc } = state;
	const alignableNodes: NodePos[] = [];
	selection.ranges.forEach(({ $from, $to }) => {
		doc.nodesBetween($from.pos, $to.pos, (child: Node, pos: number, parent: Node | null) => {
			if (parent && supportsAlignmentOfChildren(parent) && supportsAlignment(child)) {
				alignableNodes.push({ pos, node: child });
			}
		});
	});
	const result = {
		alignableNodes,
		sharedAlignmentType: getSharedAlignmentType(alignableNodes),
	};
	alignableNodesCache = { state, result };
	return result;
};

const alignNodes = (
	nodes: NodePos[],
	type: AlignmentType,
	state: EditorState,
	dispatch: Dispatch,
) => {
	const { tr } = state;
	const alignAttrValue = wrapAlignmentType(type);
	nodes.forEach(({ pos, node }) =>
		tr.setNodeMarkup(pos, undefined, { ...node.attrs, [alignAttr]: alignAttrValue }),
	);
	dispatch(tr);
};

const createAlignCommand = (type: AlignmentType) => {
	return createCommandSpec((dispatch: Dispatch, state: EditorState) => {
		const { sharedAlignmentType, alignableNodes } = getAlignableNodes(state);
		return {
			isActive: sharedAlignmentType === type,
			canRun: alignableNodes.length > 0,
			run: () => alignNodes(alignableNodes, type, state, dispatch),
		};
	});
};

export const alignTextLeft = createAlignCommand('left');
export const alignTextCenter = createAlignCommand('center');
export const alignTextRight = createAlignCommand('right');
