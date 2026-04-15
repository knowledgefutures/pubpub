import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';

import { AllowNull, Column, DataType, Model, PrimaryKey, Table } from 'sequelize-typescript';

/**
 * Caches per-day Cloudflare analytics for a community hostname + scope.
 *
 * Composite primary key: (hostname, date, scope).
 *   scope = 'community' for community-wide data,
 *           'pub:<slug>' for per-pub data,
 *           etc.
 * Past days are cached permanently (expiresAt = null).
 * Today's partial data is cached with a short TTL (expiresAt = now + 1h).
 *
 */
@Table({ timestamps: false })
export class AnalyticsCloudflareCache extends Model<
	InferAttributes<AnalyticsCloudflareCache>,
	InferCreationAttributes<AnalyticsCloudflareCache>
> {
	/** Community hostname, e.g. "demo.pubpub.org" or "journal.example.com" */
	@PrimaryKey
	@AllowNull(false)
	@Column(DataType.TEXT)
	declare hostname: string;

	/** Calendar date (ISO format, e.g. "2026-04-01") */
	@PrimaryKey
	@AllowNull(false)
	@Column(DataType.DATEONLY)
	declare date: string;

	/** Scope identifier: 'community', 'pub:my-slug', etc. */
	@PrimaryKey
	@AllowNull(false)
	@Column({ type: DataType.TEXT, defaultValue: 'community' })
	declare scope: CreationOptional<string>;

	/**
	 * Pre-aggregated analytics payload for this day.
	 * Shape: { visits, pageViews, topPaths[], countries[], devices[], referrers[] }
	 */
	@AllowNull(false)
	@Column(DataType.JSONB)
	declare data: object;

	/**
	 * When this cache entry expires. NULL = permanent (completed past days).
	 * For today's partial data, set to ~1 hour from write time.
	 */
	@Column(DataType.DATE)
	declare expiresAt: CreationOptional<Date | null>;
}
