export default {
	citation: {
		atom: true,
		attrs: {
			value: { default: '' },
			unstructuredValue: { default: '' },
			count: { default: 0 },
			label: { default: '' },
		},
		parseDOM: [
			{
				tag: 'span',
				getAttrs: (node) => {
					if (node.getAttribute('data-node-type') !== 'citation') {
						return false;
					}
					return {
						value: node.getAttribute('data-value') || '',
						unstructuredValue: node.getAttribute('data-unstructured-value') || '',
						count: Number(node.getAttribute('data-count')) || undefined,
						label: node.getAttribute('data-label') || '',
					};
				},
			},
		],
		toDOM: (node) => {
			const { href, id, count } = node.attrs;

			const { citationsRef, citationInlineStyle } = node.type.spec.defaultOptions;
			/*	There is a two-fold approach here. toDOM will render the
				citations from citationsRef so that server-side and PDF rendering will function as
				intended (that is, take the citationInlineStyle regardless of node.attrs.label).
				To keep things in sync, while toDOM is not called (e.g. on re-renders, count updates, etc)
				the citations plugin sets node.attrs.label, which causes this to rerender. 
				If we simply render from node.attrs.label, server-side and PDF rendering may be out of date 
				from the citationInlineStyling, which may have been changed more recently than the firebase
				steps were stored.
			*/
			const labelString =
				(citationsRef.current[count - 1] &&
					citationsRef.current[count - 1].inline[citationInlineStyle]) ||
				`[${count}]`;
			return [
				href ? 'a' : 'span',
				{
					...(href && { href: href }),
					...(id && { id: id }),
					'data-node-type': 'citation',
					'data-value': node.attrs.value,
					'data-unstructured-value': node.attrs.unstructuredValue,
					'data-count': node.attrs.count,
					'data-label': node.attrs.label,
					class: 'citation',
				},
				labelString,
			];
		},
		inline: true,
		group: 'inline',

		/* These are not part of the standard Prosemirror Schema spec */
		onInsert: (view, attrs) => {
			const citationNode = view.state.schema.nodes.citation.create(attrs);
			const transaction = view.state.tr.replaceSelectionWith(citationNode);
			view.dispatch(transaction);
		},
		defaultOptions: {
			citationsRef: { current: [] },
			citationInlineStyle: 'count',
		},
	},
};
