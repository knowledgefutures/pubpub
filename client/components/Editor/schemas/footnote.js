export default {
	footnote: {
		atom: true,
		attrs: {
			value: { default: '' },
			structuredValue: { default: '' },
			count: { default: 0 },
		},
		parseDOM: [
			{
				tag: 'span',
				getAttrs: (node) => {
					if (node.getAttribute('data-node-type') !== 'footnote') {
						return false;
					}
					return {
						value: node.getAttribute('data-value') || '',
						structuredValue: node.getAttribute('data-structured-value') || '',
						count: Number(node.getAttribute('data-count')) || 0,
					};
				},
			},
		],
		toDOM: (node) => {
			const { href, id } = node.attrs;
			return [
				href ? 'a' : 'span',
				{
					...(href && { href: href }),
					...(id && { id: id }),
					'data-node-type': 'footnote',
					'data-value': node.attrs.value,
					'date-structured-value': node.attrs.structuredValue,
					'data-count': node.attrs.count,
					class: 'footnote',
				},
				String(node.attrs.count),
			];
		},
		inline: true,
		group: 'inline',

		/* These are not part of the standard Prosemirror Schema spec */
		onInsert: (view, attrs) => {
			const footnoteNode = view.state.schema.nodes.footnote.create(attrs);
			const transaction = view.state.tr.replaceSelectionWith(footnoteNode);
			view.dispatch(transaction);
		},
		defaultOptions: {},
	},
};
