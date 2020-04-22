import { renderHtmlChildren } from '../utils/render';

export default {
	image: {
		atom: true,
		attrs: {
			url: { default: null },
			size: { default: 50 }, // number as percentage
			align: { default: 'center' },
			caption: { default: '' },
		},
		parseDOM: [
			{
				tag: 'figure',
				getAttrs: (node) => {
					if (node.getAttribute('data-node-type') !== 'image') {
						return false;
					}
					return {
						url: node.getAttribute('data-url') || null,
						size: Number(node.getAttribute('data-size')) || 50,
						align: node.getAttribute('data-align') || 'center',
						caption: node.firstChild.getAttribute('alt') || '',
					};
				},
			},
		],
		toDOM: (node) => {
			const resizeFunc = node.type.spec.defaultOptions.onResizeUrl;
			return [
				'figure',
				{
					'data-node-type': 'image',
					'data-size': node.attrs.size,
					'data-align': node.attrs.align,
					'data-url': node.attrs.url,
				},
				[
					'img',
					{
						src: resizeFunc(node.attrs.url),
						alt: node.attrs.caption,
					},
				],
				['figcaption', {}, renderHtmlChildren(node, node.attrs.caption, 'div')],
			];
		},
		inline: false,
		group: 'block',

		/* These are not part of the standard Prosemirror Schema spec */
		onInsert: (view, attrs) => {
			const imageNode = view.state.schema.nodes.image.create(attrs);
			const transaction = view.state.tr.replaceSelectionWith(imageNode);
			view.dispatch(transaction);
		},
		defaultOptions: {
			onResizeUrl: (url) => {
				return url;
			},
			linkToSrc: true,
		},
	},
};
