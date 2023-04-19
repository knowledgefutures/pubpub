import { Node } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';

import { Dispatch } from './types';
import { createCommandSpec } from './util';

type NodePos = { node: Node; pos: number };
type RtlDirection = null | true;

const rtlAttr = 'rtl';

const swapRtlAttr = (rtl: RtlDirection): RtlDirection => (rtl === null ? true : null);

const doAllNodesHaveRtlDirection = (nodes: NodePos[]) => {
	const directionTypes = nodes.map(({ node }) => node.attrs[rtlAttr]);
	return directionTypes.length && directionTypes.every((type) => type === true);
};

const isRtlTarget = (node: Node) => {
	const { spec } = node.type;
	return spec.attrs && rtlAttr in spec.attrs;
};

const getRtlTargetNodes = (state: EditorState): NodePos[] => {
	const { selection, doc } = state;
	const rtlTargetNodes: NodePos[] = [];
	selection.ranges.forEach(({ $from, $to }) => {
		doc.nodesBetween($from.pos, $to.pos, (node: Node, pos: number) => {
			if (isRtlTarget(node)) {
				rtlTargetNodes.push({ pos, node });
			}
		});
	});

	return rtlTargetNodes;
};

const orientNodes = (
	nodes: NodePos[],
	state: EditorState,
	dispatch: Dispatch,
	attr: RtlDirection,
) => {
	const { tr } = state;

	nodes.forEach(({ pos, node }) =>
		tr.setNodeMarkup(pos, undefined, { ...node.attrs, [rtlAttr]: attr }, node.marks),
	);
	dispatch(tr);
};

const createRtlCommandSpec = (direction: RtlDirection) => {
	return createCommandSpec((dispatch: Dispatch, state: EditorState) => {
		const rtlTargetNodes = getRtlTargetNodes(state);
		const sharedDirection = doAllNodesHaveRtlDirection(rtlTargetNodes);
		const sharedDirectionAttr = sharedDirection ? true : null;
		const rtlAttrValue = swapRtlAttr(sharedDirectionAttr);
		const canRun = rtlTargetNodes.length > 0;
		const isActive = sharedDirectionAttr === direction;
		return {
			isActive,
			canRun,
			run: () => orientNodes(rtlTargetNodes, state, dispatch, rtlAttrValue),
		};
	});
};

export const rtlToggle = createRtlCommandSpec(true);
