import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';

import type { SerializedModel } from 'types';

import {
	AllowNull,
	BelongsTo,
	Column,
	DataType,
	Default,
	Index,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';

import { UnderlayIntegration } from '../underlayIntegration/model';

/** A single skipped-asset (or similar non-fatal) warning attached to a push. */
export type UnderlayPushWarning = {
	pubId?: string | null;
	assetUrl?: string | null;
	reason: string;
};

export type UnderlayPushLogStatus = 'running' | 'success' | 'error' | 'noop';

/**
 * One entry per push attempt (manual or scheduled), forming a per-community push history. A push
 * begins as `running` and is finalized to `success` / `noop` / `error`. Entries older than 90 days
 * are pruned when a new push begins (see queries), so no separate cron is needed. Also the source of
 * truth for "is a push in progress?" on page reload and for the concurrency guard.
 */
@Table
export class UnderlayPushLog extends Model<
	InferAttributes<UnderlayPushLog>,
	InferCreationAttributes<UnderlayPushLog>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@Index('underlay_push_logs_integration_id')
	@AllowNull(false)
	@Column(DataType.UUID)
	declare underlayIntegrationId: string;

	@BelongsTo(() => UnderlayIntegration, {
		onDelete: 'CASCADE',
		as: 'underlayIntegration',
		foreignKey: 'underlayIntegrationId',
	})
	declare underlayIntegration?: UnderlayIntegration;

	@Index('underlay_push_logs_community_id')
	@AllowNull(false)
	@Column(DataType.UUID)
	declare communityId: string;

	/** The worker task driving this push, if it was enqueued via one (null for inline paths). */
	@Column(DataType.UUID)
	declare workerTaskId: string | null;

	@AllowNull(false)
	@Column(DataType.STRING)
	declare status: UnderlayPushLogStatus;

	@AllowNull(false)
	@Default(DataType.NOW)
	@Column(DataType.DATE)
	declare startedAt: CreationOptional<Date>;

	@Column(DataType.DATE)
	declare finishedAt: Date | null;

	@Column(DataType.STRING)
	declare semver: string | null;

	@Column(DataType.INTEGER)
	declare recordCount: number | null;

	@Column(DataType.INTEGER)
	declare fileCount: number | null;

	@Column(DataType.TEXT)
	declare message: string | null;

	/** Non-fatal issues (skipped assets, etc.) surfaced to the admin. */
	@Default([])
	@Column(DataType.JSONB)
	declare warnings: CreationOptional<UnderlayPushWarning[]>;

	@Column(DataType.TEXT)
	declare error: string | null;
}
