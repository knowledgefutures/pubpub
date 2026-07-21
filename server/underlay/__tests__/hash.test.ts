import { describe, expect, it } from 'vitest';

import { canonicalize, hashBytes, hashRecord, hashSchema } from '../hash';

describe('underlay/hash', () => {
	it('canonicalizes the spec example to sorted-key JSON', () => {
		const { canonical } = hashRecord({
			id: 'article-1',
			type: 'Article',
			data: { title: 'Hello', body: 'World' },
		});
		// data keys sorted alphabetically; top-level order is id, type, data.
		expect(canonical).toBe(
			'{"id":"article-1","type":"Article","data":{"body":"World","title":"Hello"}}',
		);
	});

	it('produces a stable known-answer hash matching the Underlay server algorithm', () => {
		const { hash } = hashRecord({
			id: 'article-1',
			type: 'Article',
			data: { title: 'Hello', body: 'World' },
		});
		expect(hash).toBe('e86e9e255bb6e275a4a61966896f12819d53a272d0fd7abaedadf43f43aa7b7b');
		expect(hash).toMatch(/^[0-9a-f]{64}$/);
	});

	it('is independent of key order in data', () => {
		const a = hashRecord({
			id: 'article-1',
			type: 'Article',
			data: { title: 'Hello', body: 'World' },
		});
		const b = hashRecord({
			id: 'article-1',
			type: 'Article',
			data: { body: 'World', title: 'Hello' },
		});
		expect(a.hash).toBe(b.hash);
	});

	it('canonicalizes nested objects but preserves array order', () => {
		expect(canonicalize({ b: 1, a: { d: 4, c: 3 } })).toEqual({ a: { c: 3, d: 4 }, b: 1 });
		expect(canonicalize([{ b: 2, a: 1 }, 'x'])).toEqual([{ a: 1, b: 2 }, 'x']);
		// Array order is significant to the hash.
		const arr1 = hashRecord({ id: 'x', type: 'T', data: { list: [1, 2, 3] } });
		const arr2 = hashRecord({ id: 'x', type: 'T', data: { list: [3, 2, 1] } });
		expect(arr1.hash).not.toBe(arr2.hash);
	});

	it('ignores extra top-level fields on the record (only id/type/data hash)', () => {
		const withExtra = hashRecord({
			id: 'x',
			type: 'T',
			data: { a: 1 },
			// @ts-expect-error — extra field must not affect the hash
			private: true,
		});
		const without = hashRecord({ id: 'x', type: 'T', data: { a: 1 } });
		expect(withExtra.hash).toBe(without.hash);
	});

	it('hashes schemas by canonicalized content', () => {
		expect(hashSchema({ type: 'object', properties: { title: { type: 'string' } } })).toBe(
			'75a323804435b510db3f8cc7fda9a750763b0ee894a8e28a00ffafc4823ee03a',
		);
		// Key order in the schema body does not change the hash.
		expect(hashSchema({ properties: { title: { type: 'string' } }, type: 'object' })).toBe(
			hashSchema({ type: 'object', properties: { title: { type: 'string' } } }),
		);
	});

	it('hashes raw bytes for file references', () => {
		expect(hashBytes(Buffer.from('hello'))).toBe(
			'2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
		);
	});
});
