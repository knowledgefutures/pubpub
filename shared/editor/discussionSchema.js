export default {
	discussion: {
		atom: true,
		attrs: {
			threadNumber: { default: null },
			align: { default: 'center' },
		},
		parseDOM: [
			{
				tag: 'discussion',
				getAttrs: (node) => {
					return {
						threadNumber: node.getAttribute('data-thread-number') || null,
						align: node.getAttribute('data-align') || null,
					};
				},
			},
		],
		toDOM: (node) => {
			return [
				'discussion',
				{
					'data-thread-number': node.attrs.threadNumber,
					'data-align': node.attrs.align,
				},
			];
		},
		inline: false,
		group: 'block',
		draggable: false,
	},
};
