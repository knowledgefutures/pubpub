import { DOMOutputSpec, Node } from 'prosemirror-model';

import { renderToKatexString } from 'utils/katex';

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

const getMathNodeAttrs = (mathNode) => ({
	class: 'math-node',
	...(mathNode.attrs?.id && { id: mathNode.attrs.id }),
});

const renderStaticMath = (mathNode: Node, tagName: string, displayMode: boolean) => {
	const { attrs, textContent } = mathNode;
	const count = attrs?.count;
	const textContentWithCount = count ? `${textContent} \\tag{${count}}` : textContent;
	const renderedKatex = renderToKatexString(textContentWithCount, {
		displayMode,
		throwOnError: false,
		globalGroup: true,
	});
	return [
		tagName,
		{
			...getMathNodeAttrs(mathNode),
			dangerouslySetInnerHTML: { __html: renderedKatex },
		},
	] as any;
};

export default {
	math_inline: {
		...inlineMathSchema,
		group: 'inline',
		toDOM: (node: Node, { isReact } = { isReact: false }) =>
			isReact
				? renderStaticMath(node, 'math-inline', false)
				: (['math-inline', { class: 'math-node' }, 0] as DOMOutputSpec),
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
		toDOM: (node: Node, { isReact } = { isReact: false }) =>
			isReact
				? renderStaticMath(node, 'div', true)
				: (['math-display', getMathNodeAttrs(node), 0] as DOMOutputSpec),
	},
};
