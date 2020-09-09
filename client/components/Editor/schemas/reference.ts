import classNames from 'classnames';
import { Hooks } from '@pubpub/prosemirror-reactive/src/store/types';

export default {
	reference: {
		isLeaf: true,
		inline: true,
		reactive: true,
		selectable: true,
		group: 'inline',
		attrs: {
			id: { default: null },
			targetId: { default: null },
		},
		reactiveAttrs: {
			label: function(this: Hooks, node) {
				const { targetId } = node.attrs;
				const { blockNames } = this.useDocumentState();

				if (targetId) {
					return this.useDeferredNode(targetId, (target) => {
						return target
							? `${blockNames[target.type.name]} ${target.attrs.count}`
							: null;
					});
				}

				return null;
			},
		},
		parseDOM: [
			{
				tag: 'a',
				getAttrs: (node) => {
					if (node.getAttribute('data-node-type') !== 'reference') {
						return false;
					}
					return {
						id: node.getAttribute('id'),
						targetId: node.getAttribute('data-target-id'),
					};
				},
			},
		],
		toDOM: (node) => {
			const { id, targetId, label } = node.attrs;
			return [
				'a',
				{
					...(id && { id: id }),
					// href: `#${targetId}`,
					class: classNames('reference', !label && 'missing'),
					'data-node-type': 'reference',
					'data-target-id': targetId,
				},
				label || `(ref?)`,
			];
		},
		onInsert: (view, attrs) => {
			const referenceNode = view.state.schema.nodes.reference.create(attrs);
			const transaction = view.state.tr.replaceSelectionWith(referenceNode);
			view.dispatch(transaction);
		},
	},
};
