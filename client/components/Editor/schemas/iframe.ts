import { DOMOutputSpec } from 'prosemirror-model';
import { renderHtmlChildren } from '../utils/renderHtml';

export default {
	iframe: {
		atom: true,
		attrs: {
			id: { default: null },
			url: { default: '' },
			size: { default: 75 }, // number as percentage
			height: { default: 419 },
			align: { default: 'center' },
			caption: { default: '' },
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
					renderHtmlChildren(isStaticallyRendered, node.attrs.caption, 'div'),
				],
			] as DOMOutputSpec;
		},
		inline: false,
		group: 'block',
	},
};
