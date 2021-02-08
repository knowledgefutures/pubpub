import { DOMOutputSpec } from 'prosemirror-model';
import { counter } from './reactive/counter';
import { structuredCitation } from './reactive/structuredCitation';

export default {
	footnote: {
		atom: true,
		reactive: true,
		attrs: {
			id: { default: null },
			href: { default: null },
			value: { default: '' },
			structuredValue: { default: '' },
		},
		reactiveAttrs: {
			count: counter(),
			citation: structuredCitation('structuredValue'),
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
					};
				},
			},
		],
		toDOM: (node) => {
			const { href, id, count, value, structuredValue } = node.attrs;
			return [
				href ? 'a' : 'span',
				{
					...(href && { href }),
					...(id && { id }),
					'data-node-type': 'footnote',
					'data-value': value,
					'date-structured-value': structuredValue,
					class: 'footnote',
				},
				String(count),
			] as DOMOutputSpec;
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
