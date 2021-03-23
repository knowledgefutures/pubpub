import { DOMOutputSpec } from 'prosemirror-model';
import { getCitationInlineLabel } from '../utils/citation';

import { counter } from './reactive/counter';
import { structuredCitation } from './reactive/structuredCitation';

export default {
	citation: {
		atom: true,
		reactive: true,
		attrs: {
			id: { default: null },
			href: { default: null },
			value: { default: '' },
			unstructuredValue: { default: '' },
			customLabel: { default: '' },
		},
		reactiveAttrs: {
			count: counter({
				nodeFingerprintFn: (node) => [node.attrs.value, node.attrs.unstructuredValue],
			}),
			citation: structuredCitation('value'),
		},
		parseDOM: [
			{
				tag: 'span',
				getAttrs: (node) => {
					if (node.getAttribute('data-node-type') !== 'citation') {
						return false;
					}
					return {
						id: node.getAttribute('id'),
						value: node.getAttribute('data-value') || '',
						unstructuredValue: node.getAttribute('data-unstructured-value') || '',
					};
				},
			},
		],
		toDOM: (node) => {
			const { href, id, value, unstructuredValue } = node.attrs;
			return [
				href ? 'a' : 'span',
				{
					...(href && { href }),
					...(id && { id }),
					'data-node-type': 'citation',
					'data-value': value,
					'data-unstructured-value': unstructuredValue,
					class: 'citation',
				},
				getCitationInlineLabel(node),
			] as DOMOutputSpec;
		},
		inline: true,
		group: 'inline',
	},
};
