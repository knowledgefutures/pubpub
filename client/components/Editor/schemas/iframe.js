import { renderHtmlChildren } from '../utils/render';

export default {
	iframe: {
		atom: true,
		attrs: {
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
						url: node.firstChild.getAttribute('src') || null,
						size: Number(node.getAttribute('data-size')) || 75,
						height: Number(node.firstChild.getAttribute('height')) || 419,
						align: node.getAttribute('data-align') || 'center',
						caption: node.firstChild.getAttribute('alt') || '',
					};
				},
			},
		],
		toDOM: (node) => {
			return [
				'figure',
				{
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
					},
				],
				['figcaption', {}, renderHtmlChildren(node, node.attrs.caption, 'div')],
			];
		},
		inline: false,
		group: 'block',

		/* These are not part of the standard Prosemirror Schema spec */
		onInsert: (view, attrs) => {
			const iframeNode = view.state.schema.nodes.iframe.create(attrs);
			const transaction = view.state.tr.replaceSelectionWith(iframeNode);
			view.dispatch(transaction);
		},
		defaultOptions: {},
	},
};
