import { DOMOutputSpec, Node, NodeSpec } from 'prosemirror-model';
import { highlightTree } from '@lezer/highlight';
import { defaultHighlightStyle } from '@codemirror/language';
import type { Tree } from '@lezer/common';

import { parsers } from '../plugins/code';

const fromLezer = (source: string, tree: Tree) => {
	const children: DOMOutputSpec[] = [];
	let index = 0;

	highlightTree(tree, defaultHighlightStyle, (from, to, classes) => {
		if (from > index) {
			children.push(source.slice(index, from));
		}
		children.push(['span', { class: classes }, source.slice(from, to)]);
		index = to;
	});
	if (index < source.length) {
		children.push(source.slice(index));
	}
	return children;
};

const renderStaticCode = (node: Node): DOMOutputSpec => {
	const parser = parsers[node.attrs.lang];
	if (parser) {
		const tree = parser.parse(node.textContent);
		const children = fromLezer(node.textContent, tree as unknown as Tree);
		return ['pre', ['code', ...children]] as DOMOutputSpec;
	}
	return ['pre', ['code', node.textContent]] as DOMOutputSpec;
};

const codeSchema: { [key: string]: NodeSpec } = {
	code_block: {
		content: 'text*',
		group: 'block',
		attrs: {
			lang: { default: null },
			id: { default: null },
		},
		code: true,
		selectable: false,
		parseDOM: [
			{
				tag: 'pre',
				getAttrs: (node) => {
					return {
						id: (node as Element).getAttribute('id'),
					};
				},
				preserveWhitespace: 'full' as const,
			},
		],
		toDOM: (node: Node, { isStaticallyRendered } = { isStaticallyRendered: false }) =>
			isStaticallyRendered
				? renderStaticCode(node)
				: ([
						'pre',
						{ ...(node.attrs.id && { id: node.attrs.id }) },
						['code', 0],
				  ] as DOMOutputSpec),
	},
};

export default codeSchema;
