import { renderHtmlChildren } from '../utils/render';

export default {
	file: {
		atom: true,
		attrs: {
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
						url: node.getAttribute('data-url') || null,
						fileName: node.getAttribute('data-file-name') || null,
						fileSize: node.getAttribute('data-file-size') || null,
						caption: node.getAttribute('data-caption') || '',
					};
				},
			},
		],
		toDOM: (node) => {
			const attrs = node.attrs;
			const extension = attrs.fileName ? attrs.fileName.split('.').pop() : '';
			return [
				'figure',
				{
					'data-node-type': 'file',
					'data-url': node.attrs.url,
					'data-file-name': node.attrs.fileName,
					'data-file-size': node.attrs.fileSize,
					'data-caption': node.attrs.caption,
					class: 'file',
				},
				[
					'div',
					{ class: 'bp3-card bp3-elevation-2 details' },
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
							class: 'bp3-button bp3-icon-download',
						},
					],
				],
				['figcaption', {}, renderHtmlChildren(node, node.attrs.caption, 'div')],
			];
		},
		inline: false,
		group: 'block',

		/* These are not part of the standard Prosemirror Schema spec */
		onInsert: (view, attrs) => {
			const fileNode = view.state.schema.nodes.file.create(attrs);
			const transaction = view.state.tr.replaceSelectionWith(fileNode);
			view.dispatch(transaction);
		},
		defaultOptions: {},
	},
};
