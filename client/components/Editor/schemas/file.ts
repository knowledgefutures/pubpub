import { Classes } from '@blueprintjs/core';
import { DOMOutputSpec } from 'prosemirror-model';

import { renderHtmlChildren } from '../utils/renderHtml';

const getExtension = (attrs) => {
	const { fileName, url } = attrs;
	if (url && url.includes('.')) {
		return url.split('.').pop();
	}
	if (fileName && fileName.includes('.')) {
		return fileName.split('.').pop();
	}
	return '';
};

export default {
	file: {
		atom: true,
		attrs: {
			id: { default: null },
			url: { default: null },
			fileName: { default: null },
			fileSize: { default: null },
			caption: { default: '' },
		},
		parseDOM: [
			{
				tag: 'figure',
				getAttrs: (node) => {
					if (node.getAttribute('data-node-type') !== 'file') {
						return false;
					}
					return {
						id: node.getAttribute('id') || null,
						url: node.getAttribute('data-url') || null,
						fileName: node.getAttribute('data-file-name') || null,
						fileSize: node.getAttribute('data-file-size') || null,
						caption: node.getAttribute('data-caption') || '',
					};
				},
			},
		],
		// @ts-expect-error ts-migrate(2525) FIXME: Initializer provides no value for this binding ele... Remove this comment to see the full error message
		toDOM: (node, { isStaticallyRendered } = {}) => {
			const attrs = node.attrs;
			const extension = getExtension(attrs);
			return [
				'figure',
				{
					...(node.attrs.id && { id: node.attrs.id }),
					'data-node-type': 'file',
					'data-url': node.attrs.url,
					'data-file-name': node.attrs.fileName,
					'data-file-size': node.attrs.fileSize,
					'data-caption': node.attrs.caption,
					class: 'file',
				},
				[
					'div',
					{ class: `${Classes.CARD} ${Classes.ELEVATION_2} details` },
					[
						'div',
						{
							'data-type': extension.substring(0, 4),
							class: 'file-icon file-icon-default',
						},
					],
					[
						'div',
						{ class: 'file-name' },
						[
							'a',
							{
								href: attrs.url,
								target: '_blank',
								rel: 'noopener noreferrer',
								download: attrs.fileName,
							},
							['span', {}, attrs.fileName],
						],
					],
					[
						'div',
						{ class: 'file-size' },
						attrs.fileSize ? attrs.fileSize.toString() : '',
					],
					[
						'a',
						{
							href: attrs.url,
							target: '_blank',
							rel: 'noopener noreferrer',
							download: attrs.fileName,
							class: `${Classes.BUTTON} ${Classes.ICON}-download`,
						},
					],
				],
				[
					'figcaption',
					{},
					renderHtmlChildren(isStaticallyRendered, node.attrs.caption, 'div'),
				],
			] as DOMOutputSpec;
		},
		inline: false,
		group: 'block',
	},
};
