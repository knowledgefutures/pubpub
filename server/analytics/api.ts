import type { AnalyticsEvent as AnalyticsEventPayload } from 'utils/api/schemas/analytics';

import { initServer } from '@ts-rest/express';
import { getCountryForTimezone } from 'countries-and-timezones';
import express from 'express';

import { env } from 'server/env';
import { contract } from 'utils/api/contract';

import { enqueue } from './writeBuffer';

// ─── Stitch dual-write (temporary for rollback safety) ──────────────────────

/** Fire-and-forget POST to the old Stitch/Redshift webhook so we can rollback if needed. */
function sendToStitch(payload: unknown) {
	fetch(env.STITCH_WEBHOOK_URL, {
		method: 'POST',
		body: JSON.stringify(payload),
		headers: { 'Content-Type': 'application/json' },
	}).catch(() => {
		// Silently swallow — Stitch is best-effort during the transition period.
	});
}

const s = initServer();

// ─── validation helpers ──────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Coerce a value to a valid UUID or null. Prevents bad UUIDs from killing the entire bulkCreate batch. */
function sanitizeUuid(val: unknown): string | null {
	return typeof val === 'string' && UUID_RE.test(val) ? val : null;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** Returns true if the timestamp is within an acceptable range (not future, not >30 days old). */
function isTimestampValid(ts: number): boolean {
	const now = Date.now();
	return ts <= now && ts >= now - THIRTY_DAYS_MS;
}

// ─── fields to strip (no longer stored) ──────────────────────────────────────

const DROPPED_FIELDS = new Set([
	'title',
	'country',
	'countryCode',
	'isProd',
	'communityName',
	'communitySubdomain',
	'pubTitle',
	'pubSlug',
	'collectionTitle',
	'collectionSlug',
	'collectionKind',
	'collectionIds',
	'primaryCollectionId',
	'pageTitle',
	'pageSlug',
]);

// ─── transform payload → DB record ──────────────────────────────────────────

const toEventRecord = (payload: AnalyticsEventPayload) => {
	const raw = payload as Record<string, unknown>;
	const { unique, timestamp, ...rest } = raw;

	// Strip fields that are no longer stored in the table
	const fields: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(rest)) {
		if (!DROPPED_FIELDS.has(key)) {
			fields[key] = value;
		}
	}

	// Sanitize UUID fields to prevent a single bad value from failing the whole batch
	fields.communityId = sanitizeUuid(fields.communityId);
	fields.pubId = sanitizeUuid(fields.pubId);
	fields.collectionId = sanitizeUuid(fields.collectionId);
	fields.pageId = sanitizeUuid(fields.pageId);

	return {
		...fields,
		createdAt: new Date(timestamp as number),
		isUnique: (unique as boolean | undefined) ?? null,
	};
};

export const analyticsServer = s.router(contract.analytics, {
	track: {
		middleware: [
			// needed to parse analytics events from the client sent with `navigator.sendBeacon`
			express.text(),
			(req, res, next) => {
				if (typeof req.body === 'string') {
					try {
						req.body = JSON.parse(req.body);
					} catch (err) {
						console.error(err);
					}
				}
				next();
			},
		],
		handler: async ({ body: payload }) => {
			// Dual-write to Stitch/Redshift for rollback safety (temporary).
			// Sent unconditionally (before validation) to match old behavior exactly:
			// { country, countryCode, ...payload }
			const { timezone } = payload;
			const { name: country = null, id: countryCode = null } =
				getCountryForTimezone(timezone) || {};
			sendToStitch({ country, countryCode, ...payload });

			// Reject events with unreasonable timestamps (future or >30 days old)
			if (!isTimestampValid(payload.timestamp)) {
				return {
					status: 204,
					body: undefined,
				};
			}

			const record = toEventRecord(payload);

			enqueue(record);

			return {
				status: 204,
				body: undefined,
			};
		},
	},
});
