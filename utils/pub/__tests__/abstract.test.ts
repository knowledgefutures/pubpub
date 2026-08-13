import type { DocJson } from 'types';

import { describe, expect, it } from 'vitest';

import { getAbstractDocFromPubDoc, getAbstractText, matchAbstract } from '../abstract';

// A pub's abstract is a convention inside the doc (H1 "Abstract" first, then one
// paragraph), and it used to be implemented three times with three different
// predicates. These cases pin the disagreements so they cannot silently return:
// each one is labelled with which old implementation got it wrong.

const h1 = (...content: any[]) => ({ type: 'heading', attrs: { level: 1 }, content });
const para = (...content: any[]) => ({ type: 'paragraph', content });
const text = (value: string, marks?: any[]) => ({
	type: 'text',
	text: value,
	...(marks && { marks }),
});
const doc = (...content: any[]) => ({ type: 'doc', content }) as unknown as DocJson;

describe('getAbstractText', () => {
	it('extracts a plain abstract', () => {
		expect(getAbstractText(doc(h1(text('Abstract')), para(text('Hello world.'))))).toBe(
			'Hello world.',
		);
	});

	it('trims the heading text (utils/pub/metadata.js used to miss this)', () => {
		expect(getAbstractText(doc(h1(text(' Abstract')), para(text('Trimmed.'))))).toBe('Trimmed.');
	});

	it('matches a heading split across marks (the pandoc path used to miss this)', () => {
		const heading = h1(text('Abs'), text('tract', [{ type: 'strong' }]));
		expect(getAbstractText(doc(heading, para(text('Split heading.'))))).toBe('Split heading.');
	});

	it('turns a shift-enter hard_break into a newline instead of fusing words', () => {
		// The old implementation dropped hard_break via a `default:` case, so this
		// rendered as "End of one.Start of two." in citation_abstract.
		const paragraph = para(text('End of one.'), { type: 'hard_break' }, text('Start of two.'));
		expect(getAbstractText(doc(h1(text('Abstract')), paragraph))).toBe(
			'End of one.\nStart of two.',
		);
	});

	it('keeps a link target', () => {
		const paragraph = para(
			text('See ', [{ type: 'link', attrs: { href: 'https://example.dev' } }]),
			text('it.'),
		);
		expect(getAbstractText(doc(h1(text('Abstract')), paragraph))).toBe(
			'See <https://example.dev> it.',
		);
	});

	it('includes inline equation values', () => {
		const paragraph = para(text('Where '), { type: 'equation', attrs: { value: 'x^2' } });
		expect(getAbstractText(doc(h1(text('Abstract')), paragraph))).toBe('Where x^2');
	});

	it.each([
		['no abstract heading', doc(h1(text('Introduction')), para(text('Body.')))],
		['heading not followed by a paragraph', doc(h1(text('Abstract')), h1(text('Next')))],
		['heading with nothing after it', doc(h1(text('Abstract')))],
		['an empty doc', doc()],
		[
			'a level-2 heading',
			doc({ type: 'heading', attrs: { level: 2 }, content: [text('Abstract')] }, para(text('x'))),
		],
		[
			// metadata.js read `firstChild.attrs.level` unguarded and threw here.
			'a heading with no attrs',
			doc({ type: 'heading', content: [text('Abstract')] }, para(text('x'))),
		],
	])('returns an empty string for %s', (_label, input) => {
		expect(getAbstractText(input as DocJson)).toBe('');
	});

	it('returns an empty string for a null doc', () => {
		expect(getAbstractText(null)).toBe('');
		expect(getAbstractText(undefined)).toBe('');
	});
});

describe('matchAbstract', () => {
	it('excludes the abstract heading and paragraph from the body', () => {
		const input = doc(
			h1(text('Abstract')),
			para(text('Abs.')),
			h1(text('Introduction')),
			para(text('Body.')),
		);
		const match = matchAbstract(input);
		expect(match).not.toBeNull();
		expect(match!.rest).toHaveLength(2);
		expect(JSON.stringify(match!.rest)).not.toMatch(/abstract/i);
	});
});

describe('getAbstractDocFromPubDoc', () => {
	it('wraps just the abstract paragraph, never the heading', () => {
		const result = getAbstractDocFromPubDoc(doc(h1(text('Abstract')), para(text('Only me.'))));
		expect(result).toEqual({
			type: 'doc',
			attrs: {},
			content: [para(text('Only me.'))],
		});
	});

	it('returns null when there is no abstract', () => {
		expect(getAbstractDocFromPubDoc(doc(para(text('No heading.'))))).toBeNull();
	});
});
