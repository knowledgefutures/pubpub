import { DOMOutputSpec, Node } from 'prosemirror-model';
import katex from 'katex';

import { counter } from './reactive/counter';

// don't change this object; necessary for prosmirror-math package
const inlineMathSchema = {
	content: 'text*',
	inline: true,
	atom: true,
	parseDOM: [
		{
			tag: 'math-inline', // important!
		},
	],
};

// don't change this object; necessary for prosmirror-math package
const mathDisplaySchema = {
	content: 'text*',
	atom: true,
	code: true,
	parseDOM: [
		{
			tag: 'math-display',
		},
	],
};

const renderStaticMath = (mathNode: Node, tagName: string, displayMode: boolean) => {
	const { attrs, textContent } = mathNode;
	const count = attrs?.count;
	const textContentWithCount = count ? `${textContent} \\tag{${count}}` : textContent;
	const renderedKatex = katex.renderToString(textContentWithCount, {
		displayMode,
		throwOnError: false,
		globalGroup: true,
	});
	return [
		tagName,
		{
			class: 'math-node',
			dangerouslySetInnerHTML: { __html: renderedKatex },
		},
	] as any;
};

export default {
	math_inline: {
		...inlineMathSchema,
		group: 'inline',
		toDOM: (node: Node, { isReact } = { isReact: false }) => {
			if (isReact) {
				return renderStaticMath(node, 'math-inline', false);
			}
			return ['math-inline', { class: 'math-node' }, 0] as DOMOutputSpec;
		},
	},
	math_display: {
		...mathDisplaySchema,
		reactive: true,
		group: 'block',
		attrs: {
			id: { default: null },
			hideLabel: { default: false },
		},
		reactiveAttrs: {
			count: counter({ useNodeLabels: true }),
		},
		toDOM: (node: Node, { isReact } = { isReact: false }) => {
			if (isReact) {
				return renderStaticMath(node, 'div', true);
			}
			return ['math-display', { class: 'math-node' }, 0] as DOMOutputSpec;
		},
	},
};
