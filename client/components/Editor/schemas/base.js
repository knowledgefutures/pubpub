export const baseNodes = {
	doc: {
		content: 'block+',
		attrs: {
			meta: { default: {} },
		},
	},
	paragraph: {
		selectable: false,
		content: 'inline*',
		group: 'block',
		attrs: {
			class: { default: null },
		},
		parseDOM: [
			{
				tag: 'p',
				getAttrs: (dom) => {
					return {
						class: dom.getAttribute('class'),
					};
				},
			},
		],
		toDOM: (node) => {
			/* On server rendering, the placeholder <br /> tag is not inserted. */
			/* The following check ensures spacing is maintained when server rendering */
			const isEmpty = Array.isArray(node.content) && !node.content.length;
			const children = isEmpty ? ['br'] : 0;
			return ['p', { class: node.attrs.class }, children];
		},
	},
	blockquote: {
		content: 'block+',
		group: 'block',
		selectable: false,
		parseDOM: [{ tag: 'blockquote' }],
		toDOM: () => {
			return ['blockquote', 0];
		},
	},
	horizontal_rule: {
		group: 'block',
		parseDOM: [{ tag: 'hr' }],
		selectable: false,
		toDOM: () => {
			return ['div', ['hr']];
		},
		onInsert: (view) => {
			view.dispatch(
				view.state.tr.replaceSelectionWith(
					view.state.schema.nodes.horizontal_rule.create(),
				),
			);
		},
	},
	heading: {
		attrs: {
			level: { default: 1 },
			fixedId: { default: '' },
			id: { default: '' },
		},
		content: 'inline*',
		group: 'block',
		defining: true,
		selectable: false,
		parseDOM: [
			{
				tag: 'h1',
				getAttrs: (dom) => {
					return { level: 1, id: dom.getAttribute('id') };
				},
			},
			{
				tag: 'h2',
				getAttrs: (dom) => {
					return { level: 2, id: dom.getAttribute('id') };
				},
			},
			{
				tag: 'h3',
				getAttrs: (dom) => {
					return { level: 3, id: dom.getAttribute('id') };
				},
			},
			{
				tag: 'h4',
				getAttrs: (dom) => {
					return { level: 4, id: dom.getAttribute('id') };
				},
			},
			{
				tag: 'h5',
				getAttrs: (dom) => {
					return { level: 5, id: dom.getAttribute('id') };
				},
			},
			{
				tag: 'h6',
				getAttrs: (dom) => {
					return { level: 6, id: dom.getAttribute('id') };
				},
			},
		],
		toDOM: (node) => {
			return [`h${node.attrs.level}`, { id: node.attrs.fixedId || node.attrs.id }, 0];
		},
	},
	ordered_list: {
		content: 'list_item+',
		group: 'block',
		attrs: { order: { default: 1 } },
		selectable: false,
		parseDOM: [
			{
				tag: 'ol',
				getAttrs: (dom) => {
					return { order: dom.hasAttribute('start') ? +dom.getAttribute('start') : 1 };
				},
			},
		],
		toDOM: (node) => {
			return ['ol', { start: node.attrs.order === 1 ? null : node.attrs.order }, 0];
		},
	},
	bullet_list: {
		content: 'list_item+',
		group: 'block',
		selectable: false,
		parseDOM: [{ tag: 'ul' }],
		toDOM: () => {
			return ['ul', 0];
		},
	},
	list_item: {
		content: 'paragraph block*',
		defining: true,
		selectable: false,
		parseDOM: [{ tag: 'li' }],
		toDOM: () => {
			return ['li', 0];
		},
	},
	code_block: {
		content: 'text*',
		group: 'block',
		code: true,
		selectable: false,
		parseDOM: [{ tag: 'pre', preserveWhitespace: 'full' }],
		toDOM: () => {
			return ['pre', ['code', 0]];
		},
	},
	text: {
		inline: true,
		group: 'inline',
		toDOM: (node) => {
			return node.text;
		},
	},
	hard_break: {
		inline: true,
		group: 'inline',
		selectable: false,
		parseDOM: [{ tag: 'br' }],
		toDOM: () => {
			return ['br'];
		},
	},
};

export const baseMarks = {
	em: {
		parseDOM: [
			{ tag: 'i' },
			{ tag: 'em' },
			{
				style: 'font-style',
				getAttrs: (value) => value === 'italic' && null,
			},
		],
		toDOM: () => {
			return ['em'];
		},
	},

	strong: {
		parseDOM: [
			{ tag: 'strong' },
			/*
			This works around a Google Docs misbehavior where
			pasted content will be inexplicably wrapped in `<b>`
			tags with a font-weight normal.
			*/
			{ tag: 'b', getAttrs: (node) => node.style.fontWeight !== 'normal' && null },
			{
				style: 'font-weight',
				getAttrs: (value) => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null,
			},
		],
		toDOM: () => {
			return ['strong'];
		},
	},
	link: {
		inclusive: false,
		attrs: {
			href: { default: '' },
			title: { default: null },
			target: { default: null },
		},
		parseDOM: [
			{
				tag: 'a[href]',
				getAttrs: (dom) => {
					return {
						href: dom.getAttribute('href'),
						title: dom.getAttribute('title'),
						target: dom.getAttribute('target'),
					};
				},
			},
		],
		toDOM: (node) => {
			/* Links seem to be recieving a target attr that is a dom element */
			/* coming from the wrong source in some interfaces. This ensures */
			/* only strings can be a target attr. */
			const attrs = node.attrs;
			if (attrs.target && typeof attrs.target !== 'string') {
				attrs.target = null;
			}
			return ['a', attrs];
		},
	},
	sub: {
		parseDOM: [{ tag: 'sub' }],
		toDOM: () => {
			return ['sub'];
		},
	},
	sup: {
		parseDOM: [{ tag: 'sup' }],
		toDOM: () => {
			return ['sup'];
		},
	},
	strike: {
		parseDOM: [{ tag: 's' }, { tag: 'strike' }, { tag: 'del' }],
		toDOM: () => {
			return ['s'];
		},
	},
	code: {
		parseDOM: [{ tag: 'code' }],
		toDOM: () => {
			return ['code'];
		},
	},
};
