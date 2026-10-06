import { createHash } from 'crypto';

/**
 * Content-addressed hashing for Underlay push, ported from the Underlay reference implementation
 * (`packages/protocol/src/{jcs,hash}.ts`). A delta push diffs our record hashes against the head's
 * manifest, so any record that hashes differently from the server looks changed on every push.
 * Keep this in lockstep with the server implementation.
 *
 * @see https://www.underlay.org/llms.txt §"Record Hashing"
 */

/**
 * Recursively sort object keys alphabetically (by Unicode code point), preserving array order.
 * Ensures `{"b":1,"a":2}` and `{"a":2,"b":1}` produce the same serialization (and thus hash).
 *
 * Used only for PubPub's own local signatures (no-op guard, facet cascade). It is NOT the Underlay
 * hash: `JSON.stringify` of the result still lists integer-like keys ("9", "10") first. Kept as is
 * so existing stored signatures stay valid.
 */
export const canonicalize = (value: unknown): unknown => {
	if (value === null || typeof value !== 'object') {
		return value;
	}
	if (Array.isArray(value)) {
		return value.map(canonicalize);
	}
	const sorted: Record<string, unknown> = {};
	for (const key of Object.keys(value as Record<string, unknown>).sort()) {
		sorted[key] = canonicalize((value as Record<string, unknown>)[key]);
	}
	return sorted;
};

/**
 * RFC 8785 JSON Canonicalization Scheme: `JSON.stringify` for every primitive, object keys sorted by
 * UTF-16 code units. Written out as a string because a JavaScript object enumerates integer-like
 * keys first whatever order they were inserted in, so "sort into a new object, then stringify"
 * cannot produce sorted output for them.
 */
export const jcs = (value: unknown): string => {
	switch (typeof value) {
		case 'string':
			return JSON.stringify(value);
		case 'boolean':
			return value ? 'true' : 'false';
		case 'number':
			if (!Number.isFinite(value)) {
				throw new TypeError('JCS: non-finite number');
			}
			// JSON.stringify renders -0 as "0", which is what JCS requires.
			return JSON.stringify(value);
		case 'object': {
			if (value === null) {
				return 'null';
			}
			if (Array.isArray(value)) {
				return `[${value.map(jcs).join(',')}]`;
			}
			const object = value as Record<string, unknown>;
			// Array.prototype.sort() with no comparator compares UTF-16 code units — JCS's key order.
			const parts: string[] = [];
			for (const key of Object.keys(object).sort()) {
				if (object[key] === undefined) {
					continue;
				}
				parts.push(`${JSON.stringify(key)}:${jcs(object[key])}`);
			}
			return `{${parts.join(',')}}`;
		}
		default:
			throw new TypeError(`JCS: cannot serialize ${typeof value}`);
	}
};

const sha256Hex = (input: string | Buffer | Uint8Array): string =>
	createHash('sha256').update(input).digest('hex');

/**
 * Hash a record. The canonical form is a fixed `{"id","type","data"}` envelope with only `data`
 * canonicalized by JCS. The `private` flag is deliberately not part of the hash.
 */
export const hashRecord = (record: {
	id: string;
	type: string;
	data: unknown;
}): { hash: string; canonical: string } => {
	const canonical = `{"id":${JSON.stringify(record.id)},"type":${JSON.stringify(record.type)},"data":${jcs(record.data)}}`;
	return { hash: sha256Hex(canonical), canonical };
};

/** Hash a JSON Schema document: SHA-256 of its JCS form. */
export const hashSchema = (schemaBody: unknown): string => sha256Hex(jcs(schemaBody));

/**
 * Hash an arbitrary buffer of bytes (used for file references `{"$file":"sha256:<hex>"}`).
 */
export const hashBytes = (bytes: Buffer | Uint8Array): string => sha256Hex(bytes);
