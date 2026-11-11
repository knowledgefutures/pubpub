import type { LayoutBlock } from 'utils/layout';

import { describe, expect, it } from 'vitest';

import { renderLayoutBlocks } from '../layoutHtml';
import { layoutAssetUrls } from '../mapping';

const textBlock = (id: string, content: unknown[]): LayoutBlock => ({
	id,
	type: 'text',
	content: { text: { type: 'doc', content } as never, align: 'left' },
});

describe('underlay/layoutHtml — renderLayoutBlocks', () => {
	it('renders text blocks to HTML, passes html blocks through, and keeps other blocks as markers', () => {
		const blocks: LayoutBlock[] = [
			{ id: 'b0', type: 'banner', content: { text: 'Welcome' } },
			textBlock('b1', [
				{
					type: 'heading',
					attrs: { level: 2, id: 'about' },
					content: [{ type: 'text', text: 'About' }],
				},
				{
					type: 'paragraph',
					content: [
						{ type: 'text', text: 'We publish ' },
						{ type: 'text', marks: [{ type: 'em' }], text: 'failures' },
					],
				},
				{
					type: 'image',
					attrs: {
						id: 'img',
						url: 'https://assets.pubpub.org/abc/team.png',
						size: 50,
						align: 'center',
					},
				},
			]),
			{ id: 'b2', type: 'html', content: { html: '<p>Raw <b>html</b></p>' } },
			{
				id: 'b3',
				type: 'pubs',
				content: { title: 'Latest articles', pubPreviewType: 'medium' },
			},
			textBlock('b4', []),
		];
		const out = renderLayoutBlocks(blocks);
		expect(out.map((b) => [b.id, b.type, b.title, Boolean(b.html)])).toEqual([
			['b0', 'banner', null, false],
			['b1', 'text', null, true],
			['b2', 'html', null, true],
			['b3', 'pubs', 'Latest articles', false],
			['b4', 'text', null, false],
		]);
		const html = out[1].html!;
		expect(html).toContain('About</h2>');
		expect(html).toContain('<em>failures</em>');
		expect(html).toContain('assets.pubpub.org/abc/team.png');
		expect(out[2].html).toBe('<p>Raw <b>html</b></p>');
		// The image's base asset is what the worker preloads from the asset cache.
		expect(layoutAssetUrls(out)).toContain('https://assets.pubpub.org/abc/team.png');
		// Rendering is deterministic (generated ids included), so an unchanged page hashes the same.
		expect(renderLayoutBlocks(blocks)).toEqual(out);
	});

	it('leaves a block that fails to render as a marker and reports it', () => {
		const errors: string[] = [];
		const out = renderLayoutBlocks([textBlock('bad', [{ type: 'no-such-node' }])], (block) =>
			errors.push(block.id),
		);
		expect(out).toEqual([{ id: 'bad', type: 'text', title: null }]);
		expect(errors).toEqual(['bad']);
	});

	it('treats a missing or non-array layout as empty', () => {
		expect(renderLayoutBlocks(undefined)).toEqual([]);
		expect(renderLayoutBlocks({} as never)).toEqual([]);
	});
});
