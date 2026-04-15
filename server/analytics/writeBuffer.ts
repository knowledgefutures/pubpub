/**
 * Batched write buffer for analytics events.
 *
 * Instead of issuing one INSERT per page view, events are accumulated in memory
 * and flushed to Postgres in a single `bulkCreate` every few seconds — or when
 * the buffer reaches a size cap. This reduces per-request DB overhead (index
 * maintenance, WAL writes, connection churn) from N round-trips to 1.
 *
 * ## Guarantees
 * - Events are never silently dropped. Flush failures are logged and the
 *   failed batch is retried once on the next tick.
 * - On graceful shutdown (SIGTERM / SIGINT) the buffer is flushed before exit.
 * - On crash (OOM, SIGKILL) up to FLUSH_INTERVAL_MS of events may be lost.
 *   This is acceptable for analytics — no user-facing data is affected.
 *
 * ## Tuning
 * - FLUSH_INTERVAL_MS: max age of a buffered event (default 5 s).
 * - MAX_BUFFER_SIZE:   flush early if we accumulate this many events.
 */
import { AnalyticsEvent } from './model';

// ─── configuration ───────────────────────────────────────────────────────────

const FLUSH_INTERVAL_MS = 5_000;
const MAX_BUFFER_SIZE = 500;

// ─── state ───────────────────────────────────────────────────────────────────

type EventRecord = Record<string, unknown>;

let buffer: EventRecord[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

// ─── public API ──────────────────────────────────────────────────────────────

/** Queue a single analytics event for batched insertion. */
export function enqueue(record: EventRecord) {
	buffer.push(record);
	if (buffer.length >= MAX_BUFFER_SIZE) {
		// Buffer is full — flush immediately (non-blocking).
		// eslint-disable-next-line no-empty
		flush().catch(() => {
			/* fire-and-forget */
		});
	}
}

/**
 * Flush all buffered events to Postgres. Safe to call at any time (no-ops if
 * the buffer is empty). Returns a promise that resolves when the write completes.
 */
export async function flush(): Promise<void> {
	if (buffer.length === 0) return;

	// Swap out the buffer so new events that arrive during the INSERT go into a
	// fresh array and aren't lost.
	const batch = buffer;
	buffer = [];

	try {
		await AnalyticsEvent.bulkCreate(batch as any[], {
			// ignoreDuplicates uses ON CONFLICT DO NOTHING — if a UUID collides
			// (astronomically unlikely) the row is silently skipped.
			ignoreDuplicates: true,
			// Skip per-row model validation for speed; the Zod schema in the
			// HTTP handler already validates the shape.
			validate: false,
		});
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error(`[analytics writeBuffer] bulkCreate failed for ${batch.length} events:`, err);
		// Put the failed batch back so the next flush retries them. Cap at
		// 2× MAX_BUFFER_SIZE to avoid unbounded growth if PG is truly down.
		if (buffer.length + batch.length <= MAX_BUFFER_SIZE * 2) {
			buffer = batch.concat(buffer);
		} else {
			// eslint-disable-next-line no-console
			console.error(
				`[analytics writeBuffer] dropping ${batch.length} events (buffer overflow)`,
			);
		}
	}
}

/** Start the periodic flush timer. Called once at import time. */
export function start() {
	if (flushTimer) return;
	flushTimer = setInterval(() => {
		// eslint-disable-next-line no-empty
		flush().catch(() => {
			/* fire-and-forget */
		});
	}, FLUSH_INTERVAL_MS);
	// Don't let the timer keep the process alive during shutdown.
	if (flushTimer && typeof flushTimer === 'object' && 'unref' in flushTimer) {
		flushTimer.unref();
	}
}

/** Stop the timer and flush remaining events. Called on SIGTERM / SIGINT. */
export async function stop(): Promise<void> {
	if (flushTimer) {
		clearInterval(flushTimer);
		flushTimer = null;
	}
	await flush();
}

// ─── auto-start & graceful shutdown ──────────────────────────────────────────

start();

const shutdown = async () => {
	// eslint-disable-next-line no-console
	console.info('[analytics writeBuffer] flushing before shutdown…');
	await stop();
};

process.once('SIGTERM', () => {
	shutdown().finally(() => process.exit(0));
});
process.once('SIGINT', () => {
	shutdown().finally(() => process.exit(0));
});
