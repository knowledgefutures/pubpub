import { renderHtmlChildren } from '../utils/renderHtml';
import { label } from './reactive/label';
import { buildLabel } from '../utils/references';
import { counter } from './reactive/counter';

export default {
	audio: {
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
			count: counter('audio'),
			label: label(),
		},
		parseDOM: [
			{
				tag: 'figure',
				getAttrs: (node) => {
					if (node.getAttribute('data-node-type') !== 'audio') {
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
					'data-node-type': 'audio',
					'data-size': node.attrs.size,
					'data-align': node.attrs.align,
				},
				[
					'audio',
					{
						controls: true,
						preload: 'metadata',
						src: node.attrs.url,
						alt: node.attrs.caption,
					},
				],
				[
					'figcaption',
					{},
					[
						'div',
						['strong', buildLabel(node)],
						renderHtmlChildren(isReact, node.attrs.caption, 'div'),
					],
				],
			];
		},
		inline: false,
		group: 'block',

		/* These are not part of the standard Prosemirror Schema spec */
		onInsert: (view, attrs) => {
			const audioNode = view.state.schema.nodes.audio.create(attrs);
			const transaction = view.state.tr.replaceSelectionWith(audioNode);
			view.dispatch(transaction);
		},
		defaultOptions: {},
	},
};
