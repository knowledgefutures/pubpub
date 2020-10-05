import { DOMOutputSpec } from 'prosemirror-model';
import { buildLabel } from '../utils/references';
import { renderHtmlChildren } from '../utils/renderHtml';
import { counter } from './reactive/counter';
import { label } from './reactive/label';

export default {
	image: {
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
			count: counter('image'),
			label: label(),
		},
		parseDOM: [
			{
				tag: 'figure',
				getAttrs: (node) => {
					if (node.getAttribute('data-node-type') !== 'image') {
						return false;
					}
					return {
						id: node.getAttribute('id') || null,
						url: node.getAttribute('data-url') || null,
						size: Number(node.getAttribute('data-size')) || 50,
						align: node.getAttribute('data-align') || 'center',
						caption: node.firstChild.getAttribute('alt') || '',
					};
				},
			},
		],
		// @ts-expect-error ts-migrate(2525) FIXME: Initializer provides no value for this binding ele... Remove this comment to see the full error message
		toDOM: (node, { isReact } = {}) => {
			const resizeFunc = node.type.spec.defaultOptions.onResizeUrl;

			return [
				'figure',
				{
					...(node.attrs.id && { id: node.attrs.id }),
					'data-node-type': 'image',
					'data-size': node.attrs.size,
					'data-align': node.attrs.align,
					'data-url': node.attrs.url,
				},
				[
					'img',
					{
						src: resizeFunc(node.attrs.url, node.attrs.align),
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
			] as DOMOutputSpec;
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
