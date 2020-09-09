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
		toDOM: (node, { isReact } = {}) => {
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
				['figcaption', {}, renderHtmlChildren(isReact, node.attrs.caption, 'div')],
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
