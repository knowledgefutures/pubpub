import { DOMOutputSpec } from 'prosemirror-model';

import { pruneFalsyValues } from 'utils/arrays';
import { withValue } from 'utils/fp';
import { getSrcSet, getResizedUrl } from 'utils/images';
import { isResizeableFormat } from '../utils/media';

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
			href: { default: null },
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
						altText: node.getAttribute('data-alt-text') || '',
						href: node.getAttribute('data-href') || null,
					};
				},
			},
		],
		toDOM: (node, { isStaticallyRendered } = { isStaticallyRendered: false }) => {
			const { url, align, id, altText, caption, fullResolution, size, href } = node.attrs;

			const width = align === 'breakout' ? 1920 : 800;
			const isResizeable = isResizeableFormat(url) && !fullResolution;
			const maybeResizedSrc = isResizeable ? getResizedUrl(url, 'inside', width) : url;
			const srcSet = isResizeable ? getSrcSet(url, 'inside', width) : '';
			const figcaptionId = `${id}-figure-caption`;
			const imgTag = [
				'img',
				{
					srcSet,
					src: maybeResizedSrc,
					alt: altText || '',
					...getFigcaptionRefrenceAttrs(altText, caption, figcaptionId),
				},
			];

			return [
				'figure',
				{
					...(id && { id }),
					'data-node-type': 'image',
					'data-size': size,
					'data-align': align,
					'data-url': url,
					'data-caption': caption,
					'data-href': href,
					'data-alt-text': altText,
				},
				href
					? [
							'a',
							{
								href,
								target: '_blank',
							},

							imgTag,
					  ]
					: imgTag,
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
						renderHtmlChildren(isStaticallyRendered, caption, 'div'),
					]),
				],
			] as unknown as DOMOutputSpec;
		},
		inline: false,
		group: 'block',
	},
};
