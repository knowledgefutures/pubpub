/* eslint-disable react-hooks/rules-of-hooks */
import classNames from 'classnames';
import { DOMOutputSpec } from 'prosemirror-model';
import { useDocumentState, useDeferredNode } from '@pubpub/prosemirror-reactive';

import { buildLabel } from '../utils/references';
import { NodeLabelMap, ReferenceableNodeType } from '../types';

export default {
	reference: {
		atom: true,
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
			label: (node) => {
				const { targetId } = node.attrs;
				const { nodeLabels } = useDocumentState();

				if (targetId) {
					return useDeferredNode(targetId, (target) => {
						if (!target) {
							return null;
						}

						const nodeType = target.type.name;
						const label = (nodeLabels as NodeLabelMap)[
							nodeType as ReferenceableNodeType
						];

						if (!(label && label.enabled)) {
							return null;
						}

						return buildLabel(target, label?.text);
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

					const targetId = node.getAttribute('data-target-id');

					return {
						id: node.getAttribute('id'),
						targetId,
						href: `#${targetId}`,
					};
				},
			},
		],
		toDOM: function (node) {
			const { id, targetId, label } = node.attrs;

			return [
				'a',
				{
					...(id && { id }),
					href: `#${targetId}`,
					class: classNames('reference', !label && 'missing'),
					'data-node-type': 'reference',
					'data-target-id': targetId,
				},
				label || `(ref?)`,
			] as DOMOutputSpec;
		},
	},
};
