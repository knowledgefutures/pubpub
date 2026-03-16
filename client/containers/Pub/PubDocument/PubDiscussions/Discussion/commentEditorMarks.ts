import type { DOMOutputSpec, MarkSpec } from 'prosemirror-model';

import { baseMarks } from 'components/Editor/schemas/base';

// this just adds a rel=nofollow to the link
const commentLinkMark: MarkSpec = {
	...baseMarks.link,
	toDOM: (node) => {
		const attrs = { ...node.attrs };
		const hasInvalidTarget = attrs.target && typeof attrs.target !== 'string';

		if (hasInvalidTarget) {
			attrs.target = null;
		}

		const { pubEdgeId, ...restAttrs } = attrs;

		return [
			'a',
			{
				'data-pub-edge-id': pubEdgeId,
				...restAttrs,
				rel: 'nofollow',
			},
		] as DOMOutputSpec;
	},
};

export const commentEditorCustomMarks = {
	link: commentLinkMark,
};
