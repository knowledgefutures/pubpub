import { describe, expect, it } from 'vitest';

/**
 * Warnings are one-per-skipped-asset, and a large community can produce tens of thousands. Storing
 * them all put megabytes of JSONB in a single row, which the history endpoint then returns fifty of
 * at once and the settings UI renders in full. The row keeps a bounded sample; the true total has to
 * survive on the message so the number an admin sees is still honest.
 */
const MAX_STORED_WARNINGS = 100;

/** Mirrors the truncation in finishPushLog. */
const truncate = (warnings: { reason: string }[], baseMessage: string | null) => {
	const truncated = warnings.length > MAX_STORED_WARNINGS;
	return {
		warnings: truncated ? warnings.slice(0, MAX_STORED_WARNINGS) : warnings,
		message: truncated
			? `${baseMessage ? `${baseMessage} — ` : ''}${warnings.length} assets skipped (showing first ${MAX_STORED_WARNINGS})`
			: baseMessage,
	};
};

const makeWarnings = (n: number) =>
	Array.from({ length: n }, (_, i) => ({ reason: `failed ${i}` }));

describe('underlayPushLog — warning truncation', () => {
	it('stores every warning when the push produced few', () => {
		const result = truncate(makeWarnings(7), 'Pushed version v1.0.0');
		expect(result.warnings).toHaveLength(7);
		// Nothing was dropped, so the message must not claim otherwise.
		expect(result.message).toBe('Pushed version v1.0.0');
	});

	it('caps the stored sample but preserves the true total in the message', () => {
		const result = truncate(makeWarnings(33818), 'Pushed version v1.0.0');
		expect(result.warnings).toHaveLength(MAX_STORED_WARNINGS);
		expect(result.message).toContain('33818 assets skipped');
		expect(result.message).toContain('showing first 100');
		expect(result.message).toContain('Pushed version v1.0.0');
	});

	it('keeps the row small enough to serve fifty of them in one response', () => {
		const capped = truncate(makeWarnings(33818), null);
		// The uncapped array was ~6MB; a history page returns up to 50 logs at once.
		const bytes = JSON.stringify(capped.warnings).length;
		expect(bytes * 50).toBeLessThan(1_000_000);
	});

	it('does not lose the total when there is no base message', () => {
		const result = truncate(makeWarnings(500), null);
		expect(result.message).toBe('500 assets skipped (showing first 100)');
	});

	it('does not truncate exactly at the boundary', () => {
		expect(truncate(makeWarnings(100), null).warnings).toHaveLength(100);
		expect(truncate(makeWarnings(100), null).message).toBeNull();
		expect(truncate(makeWarnings(101), null).warnings).toHaveLength(100);
	});
});
