import { renderHtmlChildren } from '../utils/renderHtml';
import { counter } from './reactive/counter';

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
		},
		reactiveAttrs: {
			count: counter('figure'),
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
					};
				},
			},
		],
		// @ts-expect-error ts-migrate(2525) FIXME: Initializer provides no value for this binding ele... Remove this comment to see the full error message
		toDOM: (node, { isReact } = {}) => {
			return [
				'figure',
				{
					...(node.attrs.id && { id: node.attrs.id }),
					'data-node-type': 'video',
					'data-size': node.attrs.size,
					'data-align': node.attrs.align,
				},
				[
					'video',
					{
						controls: true,
						preload: 'metadata',
						src: node.attrs.url,
						alt: node.attrs.caption,
					},
				],
				['figcaption', {}, renderHtmlChildren(isReact, node.attrs.caption, 'div')],
			];
		},
		inline: false,
		group: 'block',

		/* These are not part of the standard Prosemirror Schema spec */
		onInsert: (view, attrs) => {
			const videoNode = view.state.schema.nodes.video.create(attrs);
			const transaction = view.state.tr.replaceSelectionWith(videoNode);
			view.dispatch(transaction);
		},
		defaultOptions: {},
	},
};
