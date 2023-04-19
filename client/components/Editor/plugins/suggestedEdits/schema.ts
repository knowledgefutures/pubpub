import { MarkSpec, Node, NodeSpec, ParseRule } from 'prosemirror-model';

import { arraysHaveSameElements } from 'utils/arrays';
import { assert } from 'utils/assert';
import { pruneFalsyObjectValues } from 'utils/objects';

export const suggestionNodeAttributes = [
	'suggestionId',
	'suggestionTimestamp',
	'suggestionUserId',
	'suggestionKind',
	'suggestionOriginalAttrs',
	'suggestionDiscussionId',
];

export const marks: Record<string, MarkSpec> = {
	suggestion: {
		attrs: {
			suggestionKind: {},
			suggestionId: { default: null },
			suggestionUserId: { default: null },
			suggestionTimestamp: { default: null },
			suggestionDiscussionId: { default: null },
			suggestionOriginalMarks: { default: null },
		},
		inclusive: false,
		parseDOM: [
			{
				tag: 'span[data-suggestion-mark]',
				getAttrs: (element: string | HTMLElement) => {
					if (
						element instanceof HTMLElement &&
						element.hasAttribute(`data-suggestion-mark`)
					) {
						return {
							suggestionKind: element.getAttribute('data-suggestion-kind'),
							suggestionId: element.getAttribute('data-suggestion-id'),
							suggestionUserId: element.getAttribute('data-suggestion-user-id'),
							suggestionTimestamp: element.getAttribute('data-suggestion-timestamp'),
							suggestionDiscussionId: element.getAttribute(
								'data-suggestion-discussion-id',
							),
							suggestionOriginalMarks: element.getAttribute(
								'data-suggestion-original-marks',
							),
						};
					}
					return false;
				},
			},
		],
		toDOM: (node) => {
			return [
				'span',
				{
					'data-suggestion-mark': true,
					'data-suggestion-kind': node.attrs.suggestionKind,
					'data-suggestion-id': node.attrs.suggestionId,
					'data-suggestion-user-id': node.attrs.suggestionUserId,
					'data-suggestion-timestamp': node.attrs.suggestionTimestamp,
					'data-suggestion-discussion-id': node.attrs.suggestionDiscussionId,
					'data-suggestion-original-marks': node.attrs.suggestionOriginalMarks,
				},
			];
		},
	},
};

export const amendNodeSpecWithSuggestedEdits = (nodeKey: string, nodeSpec: NodeSpec): NodeSpec => {
	const { parseDOM, toDOM, attrs } = nodeSpec;
	if (nodeKey === 'text') {
		return nodeSpec;
	}
	const newAttrs = {
		suggestionId: {
			default: null,
		},
		suggestionTimestamp: {
			default: null,
		},
		suggestionUserId: {
			default: null,
		},
		suggestionDiscussionId: {
			default: null,
		},
		suggestionKind: {
			default: null,
		},
		suggestionOriginalAttrs: {
			default: null,
		},
	};
	assert(arraysHaveSameElements(Object.keys(newAttrs), suggestionNodeAttributes));
	return {
		...nodeSpec,
		attrs: {
			...attrs,
			...newAttrs,
		},
		parseDOM: parseDOM?.map((rule: ParseRule) => {
			const { getAttrs } = rule;
			return {
				...rule,
				getAttrs: (element: string | HTMLElement) => {
					const originalAttrs = getAttrs?.(element) ?? null;
					if (originalAttrs) {
						if (typeof element === 'string') {
							return originalAttrs;
						}
						return {
							...originalAttrs,
							suggestionKind: element.getAttribute('data-suggestion-kind'),
							suggestionId: element.getAttribute('data-suggestion-id'),
							suggestionUserId: element.getAttribute('data-suggestion-user-id'),
							suggestionTimestamp: element.getAttribute('data-suggestion-timestamp'),
							suggestionDiscussionId: element.getAttribute(
								'data-suggestion-discussion-id',
							),
							suggestionOriginalAttrs: element.getAttribute(
								'data-suggestion-original-attrs',
							),
						};
					}
					return originalAttrs;
				},
			};
		}),
		toDOM: (node: Node, ...restArgs: any[]) => {
			const {
				suggestionId,
				suggestionTimestamp,
				suggestionUserId,
				suggestionDiscussionId,
				suggestionKind,
				suggestionOriginalAttrs,
			} = node.attrs;
			// TS doesn't know that we let toDOM take a secondary argument
			// so we have to cast it to any
			const domOutputSpec = (toDOM as any)(node, ...restArgs);
			const suggestionAttrs = pruneFalsyObjectValues({
				'data-suggestion-id': suggestionId,
				'data-suggestion-timestamp': suggestionTimestamp,
				'data-suggestion-user-id': suggestionUserId,
				'data-suggestion-discussion-id': suggestionDiscussionId,
				'data-suggestion-kind': suggestionKind,
				'data-suggestion-original-attrs': suggestionOriginalAttrs,
			});
			if (Array.isArray(domOutputSpec)) {
				const [tagEntry, maybeAttrsEntry, ...restEntries] = domOutputSpec;
				if (
					maybeAttrsEntry &&
					typeof maybeAttrsEntry === 'object' &&
					!Array.isArray(maybeAttrsEntry)
				) {
					return [tagEntry, { ...maybeAttrsEntry, ...suggestionAttrs }, ...restEntries];
				}
				return [tagEntry, suggestionAttrs, maybeAttrsEntry, ...restEntries].filter(
					// 0 is a hole for child content so we need to preserve it
					(entry) => entry === 0 || !!entry,
				);
			}
			return domOutputSpec;
		},
	};
};
