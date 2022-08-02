import { DOMOutputSpec, Node } from 'prosemirror-model';
import React from 'react';

import { renderHtmlChildren } from '../utils/renderHtml';
import { counter } from './reactive/counter';

export default {
	equation: {
		atom: true,
		attrs: {
			id: { default: null },
			value: { default: '' },
			html: { default: '' },
			renderForPandoc: { default: false },
		},
		parseDOM: [
			{
				tag: 'span',
				getAttrs: (node) => {
					if (node.getAttribute('data-node-type') !== 'math-inline') {
						return false;
					}

					return {
						value: node.getAttribute('data-value') || '',
						html: node.firstChild.innerHTML || '',
					};
				},
			},
		],
		toDOM: (node, { isReact } = { isReact: false }) => {
			return [
				'span',
				{
					'data-node-type': 'math-inline',
					'data-value': node.attrs.value,
				},
				renderHtmlChildren(isReact, node.attrs.html),
			] as DOMOutputSpec;
		},
		inline: true,
		group: 'inline',
		draggable: false,
	},
	block_equation: {
		atom: true,
		reactive: true,
		attrs: {
			id: { default: null },
			value: { default: '' },
			html: { default: '' },
			renderForPandoc: { default: false },
			hideLabel: { default: false },
		},
		reactiveAttrs: {
			count: counter({ useNodeLabels: true }),
		},
		parseDOM: [
			{
				tag: 'div',
				getAttrs: (node) => {
					if (node.getAttribute('data-node-type') !== 'math-block') {
						return false;
					}
					const html =
						node.querySelector('span.katex')?.outerHTML || node.firstChild.innerHTML;

					return {
						id: node.getAttribute('id') || null,
						value: node.getAttribute('data-value') || '',
						html: html || '',
					};
				},
			},
		],
		// @ts-expect-error ts-migrate(2525) FIXME: Initializer provides no value for this binding ele... Remove this comment to see the full error message
		toDOM: (node: Node, { isReact } = {}) => {
			if (node.attrs.renderForPandoc) {
				return (
					<script
						type="math/tex-display"
						// eslint-disable-next-line react/no-danger
						dangerouslySetInnerHTML={{ __html: node.attrs.value }}
					/>
				) as any;
			}
			return [
				'div',
				{
					...(node.attrs.id && { id: node.attrs.id }),
					'data-node-type': 'math-block',
					'data-value': node.attrs.value,
				},
				['span'],
				renderHtmlChildren(isReact, node.attrs.html),
				[
					'span',
					{ class: 'equation-label', spellcheck: 'false' },
					node.attrs.count ? `(${node.attrs.count})` : '',
				],
			] as DOMOutputSpec;
		},

		inline: false,
		group: 'block',
	},
};
