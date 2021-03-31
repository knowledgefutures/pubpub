import { Node, NodeType } from 'prosemirror-model';
import { NodeSelection } from 'prosemirror-state';
import { lift, setBlockType, wrapIn } from 'prosemirror-commands';
import { wrapInList } from 'prosemirror-schema-list';

import { Attrs, ToggleOptions, ToggleCommandFn } from './types';
import { createTypeToggle } from './util';

const nodeMatchesTypeAndAttrs = (node: Node, type: NodeType, attrs?: Attrs) => {
	if (node.type === type) {
		if (!attrs) {
			return true;
		}
		return Object.keys(attrs).every((key) => attrs[key] === node.attrs[key]);
	}
	return false;
};

const blockTypeIsActive = (options: ToggleOptions<NodeType>) => {
	const { state, type, withAttrs } = options;
	if (!type) {
		return false;
	}

	const { $from } = state.selection;
	const selectedNode = (state.selection as NodeSelection).node;
	if (selectedNode && nodeMatchesTypeAndAttrs(selectedNode, type, withAttrs)) {
		return true;
	}

	let currentDepth = $from.depth;
	while (currentDepth > 0) {
		const currentNodeAtDepth = $from.node(currentDepth);
		if (nodeMatchesTypeAndAttrs(currentNodeAtDepth, type, withAttrs)) {
			return true;
		}
		currentDepth -= 1;
	}

	return false;
};

const toggleBlockType = (options: ToggleOptions<NodeType>) => {
	const { state, type, withAttrs, dispatch } = options;
	const { schema } = state;
	const isActive = blockTypeIsActive(options);
	const newNodeType = isActive ? schema.nodes.paragraph : type;
	const setBlockFunction = setBlockType(newNodeType, withAttrs);
	return setBlockFunction(state, dispatch);
};

const toggleWrap = (options: ToggleOptions<NodeType>) => {
	const { state, type, dispatch } = options;
	if (blockTypeIsActive(options)) {
		return lift(state, dispatch);
	}
	return wrapIn(type)(state, dispatch);
};

const toggleWrapList = (options: ToggleOptions<NodeType>) => {
	const { state, type, dispatch } = options;
	if (blockTypeIsActive(options)) {
		return lift(state, dispatch);
	}
	return wrapInList(type)(state, dispatch);
};

const createBlockTypeToggle = (options: {
	typeName: string;
	withAttrs?: Attrs;
	commandFn?: ToggleCommandFn<NodeType>;
}) => {
	const { typeName, withAttrs, commandFn = toggleBlockType } = options;
	return createTypeToggle({
		withAttrs,
		commandFn,
		isActiveFn: blockTypeIsActive,
		getTypeFromSchema: (schema) => schema.nodes[typeName] as NodeType,
	});
};

export const createHeadingBlockTypeToggle = (level: number) => {
	return createBlockTypeToggle({ typeName: 'heading', withAttrs: { level } });
};

export const createListTypeToggle = (typeName: string) => {
	return createBlockTypeToggle({
		typeName,
		commandFn: toggleWrapList,
	});
};

export const paragraphToggle = createBlockTypeToggle({ typeName: 'paragraph' });
export const codeBlockToggle = createBlockTypeToggle({ typeName: 'code_block' });

export const bulletListToggle = createListTypeToggle('bullet_list');
export const orderedListToggle = createListTypeToggle('ordered_list');

export const blockquoteToggle = createBlockTypeToggle({
	typeName: 'blockquote',
	commandFn: toggleWrap,
});

export const heading1Toggle = createHeadingBlockTypeToggle(1);
export const heading2Toggle = createHeadingBlockTypeToggle(2);
export const heading3Toggle = createHeadingBlockTypeToggle(3);
export const heading4Toggle = createHeadingBlockTypeToggle(4);
export const heading5Toggle = createHeadingBlockTypeToggle(5);
export const heading6Toggle = createHeadingBlockTypeToggle(6);
