import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';

import type { SerializedModel } from 'types';

import {
	BelongsTo,
	Column,
	DataType,
	Default,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';

import { Community } from '../community/model';

/**
 * Per-community configuration for pushing content to an Underlay collection.
 * Mirrors `DepositTarget`: the API key is stored AES-encrypted at rest and must be stripped
 * before returning to any client (see `getUnderlayIntegration`).
 */
@Table
export class UnderlayIntegration extends Model<
	InferAttributes<UnderlayIntegration>,
	InferCreationAttributes<UnderlayIntegration>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@Column(DataType.UUID)
	declare communityId: string | null;

	@BelongsTo(() => Community, { onDelete: 'CASCADE', as: 'community', foreignKey: 'communityId' })
	declare community?: Community;

	/** Underlay organization slug (the `:owner` in `:owner/:slug`). */
	@Column(DataType.STRING)
	declare underlayOrg: string | null;

	/** Underlay collection slug. */
	@Column(DataType.STRING)
	declare underlayCollection: string | null;

	/** Markdown README pushed as the Underlay version's `metadata.readme`. Safe to expose to clients. */
	@Column(DataType.TEXT)
	declare readme: string | null;

	/** AES-256-encrypted Underlay API key (hex ciphertext). Never expose to clients. */
	@Column(DataType.TEXT)
	declare apiKey: string | null;

	/** Initialization vector for the encrypted API key. */
	@Column(DataType.TEXT)
	declare apiKeyInitVec: string | null;

	@Default(true)
	@Column(DataType.BOOLEAN)
	declare includeReleaseHtml: CreationOptional<boolean>;

	@Default(true)
	@Column(DataType.BOOLEAN)
	declare includeAssets: CreationOptional<boolean>;

	@Default(false)
	@Column(DataType.BOOLEAN)
	declare includePdfs: CreationOptional<boolean>;

	/** Automatic push cadence in days. null = manual only. */
	@Column(DataType.INTEGER)
	declare scheduleDays: number | null;

	@Column(DataType.DATE)
	declare lastPushedAt: Date | null;

	@Column(DataType.STRING)
	declare lastPushSemver: string | null;

	@Column(DataType.STRING)
	declare lastPushStatus: 'success' | 'error' | 'noop' | null;

	@Column(DataType.TEXT)
	declare lastPushError: string | null;

	/** Signature of the most recent successful push, used for the client-side no-op guard. */
	@Column(DataType.TEXT)
	declare lastManifestHash: string | null;

	/** Present on the sanitized JSON shape returned to clients. */
	declare hasApiKey?: boolean;
}
