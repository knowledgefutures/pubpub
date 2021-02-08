import { DOMOutputSpec } from 'prosemirror-model';
import { pruneFalsyValues } from 'utils/arrays';
import { withValue } from 'utils/fp';
import { imageCanBeResized } from '../utils/media';
import { buildLabel } from '../utils/references';
import { renderHtmlChildren } from '../utils/renderHtml';
import { counter } from './reactive/counter';
import { label } from './reactive/label';

// See https://github.com/pubpub/pubpub/issues/1208 for the rationale for this logic
const getFigcaptionRefrenceAttrs = (alt, caption, figcaptionId) => {
	if (alt && caption) {
		return {
			'aria-describedby': figcaptionId,
		};
	}
	if (caption) {
		return {
			'aria-labelledby': figcaptionId,
		};
	}
	return {};
};

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
			altText: { default: '' },
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
						caption: node.getAttribute('data-caption') || '',
						size: Number(node.getAttribute('data-size')) || 50,
						align: node.getAttribute('data-align') || 'center',
						altText: node.firstChild?.getAttribute('alt') || '',
					};
				},
			},
		],
		toDOM: (node, { isReact } = { isReact: false }) => {
			const { url, align, id, altText, caption, fullResolution, size } = node.attrs;

			const resizeFunc = node.type.spec.defaultOptions.onResizeUrl;
			const maybeResizedSrc =
				resizeFunc && !fullResolution && imageCanBeResized(url)
					? resizeFunc(url, align)
					: url;

			const figcaptionId = `${id}-figure-caption`;

			return [
				'figure',
				{
					...(id && { id }),
					'data-node-type': 'image',
					'data-size': size,
					'data-align': align,
					'data-url': url,
					'data-caption': caption,
				},
				[
					'img',
					{
						src: maybeResizedSrc,
						alt: altText || '',
						...getFigcaptionRefrenceAttrs(altText, caption, figcaptionId),
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
						renderHtmlChildren(isReact, caption, 'div'),
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
