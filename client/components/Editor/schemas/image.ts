import { DOMOutputSpec } from 'prosemirror-model';
import { pruneFalsyValues } from 'utils/arrays';
import { withValue } from 'utils/fp';
import { imageCanBeResized } from '../utils/media';
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
			hideLabel: { default: false },
			fullResolution: { default: false },
		},
		reactiveAttrs: {
			count: counter({ useNodeLabels: true }),
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
		toDOM: (node, { isReact } = { isReact: false }) => {
			const resizeFunc = node.type.spec.defaultOptions.onResizeUrl;
			const maybeResizedSrc =
				resizeFunc && !node.attrs.fullResolution && imageCanBeResized(node.attrs.url)
					? resizeFunc(node.attrs.url, node.attrs.align)
					: node.attrs.url;

			return [
				'figure',
				{
					...(node.attrs.id && { id: node.attrs.id }),
					'data-node-type': 'image',
					'data-size': node.attrs.size,
					'data-align': node.attrs.align,
					'data-url': node.attrs.url,
				},
				['img', { src: maybeResizedSrc }],
				[
					'figcaption',
					{},
					pruneFalsyValues([
						'div',
						{},
						withValue(buildLabel(node), (builtLabel) => [
							'strong',
							{ spellcheck: 'false' },
							builtLabel,
						]),
						renderHtmlChildren(isReact, node.attrs.caption, 'div'),
					]),
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
