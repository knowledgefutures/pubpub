import type { DocJson } from 'types';
import type { LayoutBlock } from 'utils/layout';

import type { LayoutBlockInput } from './mapping';

import React from 'react';

import { getReactedDoc } from '@pubpub/prosemirror-reactive';
import { Node } from 'prosemirror-model';
import ReactDOMServer from 'react-dom/server';

import { renderStatic } from 'client/components/Editor/utils/renderStatic';
import { editorSchema } from 'client/components/Editor/utils/schema';
import { normalizeResizeUrlsInHtml } from 'utils/images';

/**
 * Turns a PubPub layout (a Page's `layout`, a Collection's `layout.blocks`) into the pre-rendered
 * blocks the Underlay mapping takes. Text blocks hold ProseMirror JSON and are rendered with the same
 * static renderer the release HTML uses. Html blocks are passed through with resize-CDN URLs
 * normalized, as PubPub's LayoutHtml does before showing them. Every other block type keeps only
 * its id, type and title, so a consumer can see that something was there.
 */

/**
 * Render with ids that depend only on the block, not on chance. Nodes saved without an id get a
 * temporary one during rendering, and prosemirror-reactive's default is random, which would give an
 * unchanged page a new hash (and a new Underlay version) on every push.
 */
const renderDoc = (doc: DocJson, blockId: string): string => {
	let next = 0;
	const reactedDoc = getReactedDoc(Node.fromJSON(editorSchema, doc), {
		documentState: { nodeLabels: {} },
		missingIdGenerator: () => {
			next += 1;
			return `${blockId}-${next}`;
		},
	}).toJSON();
	const elements = renderStatic({
		schema: editorSchema,
		doc,
		reactedDoc,
		noteManager: undefined,
	});
	return ReactDOMServer.renderToStaticMarkup(
		React.createElement(React.Fragment, null, ...elements),
	);
};

const blockTitle = (block: LayoutBlock): string | undefined => {
	const content = block.content as { title?: unknown } | undefined;
	return typeof content?.title === 'string' && content.title ? content.title : undefined;
};

export const renderLayoutBlocks = (
	blocks: LayoutBlock[] | null | undefined,
	onError?: (block: LayoutBlock, error: unknown) => void,
): LayoutBlockInput[] =>
	(Array.isArray(blocks) ? blocks : []).map((block) => {
		const base: LayoutBlockInput = {
			id: block.id,
			type: block.type,
			title: blockTitle(block) ?? null,
		};
		try {
			if (block.type === 'text' && block.content?.text) {
				return { ...base, html: renderDoc(block.content.text, block.id) };
			}
			if (block.type === 'html' && block.content?.html) {
				return { ...base, html: normalizeResizeUrlsInHtml(block.content.html) };
			}
		} catch (error) {
			// A block that won't render is left as a marker rather than failing the push.
			onError?.(block, error);
		}
		return base;
	});
