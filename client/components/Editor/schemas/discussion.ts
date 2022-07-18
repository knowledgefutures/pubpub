import { DOMOutputSpec } from 'prosemirror-model';

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
			] as DOMOutputSpec;
		},
		inline: false,
		group: 'block',
		draggable: false,

		/* NodeView Options. These are not part of the standard Prosemirror Schema spec */
		isNodeView: true,
		onInsert: (view) => {
			const discussionNode = view.state.schema.nodes.discussion.create();
			const transaction = view.state.tr.replaceSelectionWith(discussionNode);
			view.dispatch(transaction);
		},
		defaultOptions: {
			getThreads: () => {
				return [];
			},
			getPubData: () => {
				return undefined;
			},
			getLocationData: () => {
				return undefined;
			},
			getLoginData: () => {
				return undefined;
			},
			getOnPostDiscussion: () => {
				return undefined;
			},
			getOnPutDiscussion: () => {
				return undefined;
			},
			getGetHighlightContent: () => {
				return undefined;
			},
			getHandleQuotePermalink: () => {
				return undefined;
			},
		},
	},
};
