import { createHash } from 'crypto';

/**
 * Content-addressed hashing for Underlay push, ported verbatim from the Underlay server
 * (`src/lib/core/hash.ts`). Any record or schema pushed to Underlay MUST hash identically to the
 * way the server hashes it, or the push is rejected with "Unexpected record hash". Keep this in
 * lockstep with the server implementation.
 *
 * @see https://underlay.org — public/llms.txt §"Record Hashing"
 */

/**
 * Recursively sort object keys alphabetically (by Unicode code point), preserving array order.
 * Ensures `{"b":1,"a":2}` and `{"a":2,"b":1}` produce the same serialization (and thus hash).
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
 * Hash a record's canonical JSON. The top-level keys MUST appear in the order id, type, data, and
 * `data` MUST be canonicalized. The `private` flag is deliberately not part of the hash.
 */
export const hashRecord = (record: {
	id: string;
	type: string;
	data: unknown;
}): { hash: string; canonical: string } => {
	const canonical = JSON.stringify({
		id: record.id,
		type: record.type,
		data: canonicalize(record.data),
	});
	const hash = createHash('sha256').update(canonical).digest('hex');
	return { hash, canonical };
};

/**
 * Hash a JSON Schema document. Schemas are content-addressed by the SHA-256 of their canonicalized
 * JSON, using the same rules as records.
 */
export const hashSchema = (schemaBody: unknown): string =>
	createHash('sha256')
		.update(JSON.stringify(canonicalize(schemaBody)))
		.digest('hex');

/**
 * Hash an arbitrary buffer of bytes (used for file references `{"$file":"sha256:<hex>"}`).
 */
export const hashBytes = (bytes: Buffer | Uint8Array): string =>
	createHash('sha256').update(bytes).digest('hex');
