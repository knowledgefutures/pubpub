import type { DOMOutputSpec } from 'prosemirror-model';

import { pruneFalsyValues } from 'utils/arrays';
import { withValue } from 'utils/fp';

import { buildLabel } from '../utils/references';
import { renderHtmlChildren } from '../utils/renderHtml';
import { counter } from './reactive/counter';
import { label } from './reactive/label';

export default {
	iframe: {
		atom: true,
		reactive: true,
		attrs: {
			id: { default: null },
			url: { default: '' },
			size: { default: 75 }, // number as percentage
			height: { default: 419 },
			align: { default: 'center' },
			caption: { default: '' },
			hideLabel: { default: false },
		},
		reactiveAttrs: {
			count: counter({ useNodeLabels: true }),
			label: label(),
		},
		parseDOM: [
			{
				tag: 'figure',
				getAttrs: (node) => {
					if (node.getAttribute('data-node-type') !== 'iframe') {
						return false;
					}
					return {
						id: node.getAttribute('id') || null,
						url: node.firstChild.getAttribute('src') || null,
						size: Number(node.getAttribute('data-size')) || 75,
						height: Number(node.firstChild.getAttribute('height')) || 419,
						align: node.getAttribute('data-align') || 'center',
						caption: node.firstChild.getAttribute('alt') || '',
						hideLabel: node.getAttribute('data-hide-label') || '',
					};
				},
			},
		],
		toDOM: (node, { isStaticallyRendered } = { isStaticallyRendered: false }) => {
			const figcaptionId = `${node.attrs.id}-figure-caption`;
			return [
				'figure',
				{
					...(node.attrs.id && { id: node.attrs.id }),
					'data-node-type': 'iframe',
					'data-size': node.attrs.size,
					'data-align': node.attrs.align,
					'data-hide-label': node.attrs.hideLabel,
				},
				[
					'iframe',
					{
						alt: node.attrs.caption,
						src: node.attrs.url,
						height: node.attrs.height,
						'aria-describedby': figcaptionId,
						allowfullscreen: 'true',
					},
				],
				[
					'figcaption',
					{ id: figcaptionId },
					pruneFalsyValues([
						'div',
						{},
						withValue(buildLabel(node), (builtLabel) => [
							'strong',
							{ spellcheck: 'false' },
							builtLabel,
						]),
						renderHtmlChildren(isStaticallyRendered, node.attrs.caption, 'div'),
					]),
				],
			] as DOMOutputSpec;
		},
		inline: false,
		group: 'block',
	},
};
