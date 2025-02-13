import { DOMOutputSpec } from 'prosemirror-model';

import { pruneFalsyValues } from 'utils/arrays';
import { withValue } from 'utils/fp';

import { renderHtmlChildren } from '../utils/renderHtml';
import { counter } from './reactive/counter';
import { label } from './reactive/label';
import { buildLabel } from '../utils/references';

export default {
	video: {
		atom: true,
		reactive: true,
		attrs: {
			id: { default: null },
			url: { default: null },
			size: { default: 50 }, // number as percentage
			align: { default: 'center' },
			caption: { default: '' },
			hideLabel: { default: false },
			loop: { default: false },
		},
		reactiveAttrs: {
			count: counter({ useNodeLabels: true }),
			label: label(),
		},
		parseDOM: [
			{
				tag: 'figure',
				getAttrs: (node) => {
					if (node.getAttribute('data-node-type') !== 'video') {
						return false;
					}
					return {
						id: node.getAttribute('id') || null,
						url: node.firstChild.getAttribute('src') || null,
						size: Number(node.getAttribute('data-size')) || 50,
						align: node.getAttribute('data-align') || 'center',
						caption: node.firstChild.getAttribute('alt') || '',
						loop: !!node.firstChild.getAttribute('loop'),
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
					'data-node-type': 'video',
					'data-size': node.attrs.size,
					'data-align': node.attrs.align,
					'data-hide-label': node.attrs.hideLabel,
				},
				[
					'video',
					{
						controls: 'true',
						preload: 'metadata',
						src: node.attrs.url,
						alt: node.attrs.caption,
						'aria-describedby': figcaptionId,
						loop: node.attrs.loop ? '' : undefined,
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
			] as unknown as DOMOutputSpec;
		},
		inline: false,
		group: 'block',
	},
};
