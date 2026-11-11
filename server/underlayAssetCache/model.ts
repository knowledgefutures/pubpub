import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';

import type { SerializedModel } from 'types';

import {
	AllowNull,
	Column,
	DataType,
	Default,
	Index,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';

/**
 * Global, immutable url → content-hash cache for pushed assets.
 *
 * `assets.pubpub.org` URLs are content-addressed by PubPub, so a URL permanently determines its
 * bytes and therefore its SHA-256 hash. Caching that mapping lets a push produce a file reference
 * without re-downloading the asset — the bytes are only fetched if the Underlay server actually
 * asks for them (via the negotiate `needed_files` / 422 `filesNeeded` path). This mainly saves the
 * community/collection/author branding images, which are recomputed on every push.
 *
 * Not scoped to an integration: the mapping is immutable, so it is safe to share across every
 * community and collection.
 */
@Table
export class UnderlayAssetCache extends Model<
	InferAttributes<UnderlayAssetCache>,
	InferCreationAttributes<UnderlayAssetCache>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	/** The source asset URL as it appears in PubPub (the localizer's lookup key). */
	@Index({ unique: true, name: 'underlay_asset_cache_url' })
	@AllowNull(false)
	@Column(DataType.TEXT)
	declare url: string;

	/** Bare lowercase-hex SHA-256 of the asset's bytes. */
	@AllowNull(false)
	@Column(DataType.TEXT)
	declare hash: string;

	/** Content type derived when first fetched; kept so the cached reference matches the fetched one. */
	@Column(DataType.STRING)
	declare mimeType: string | null;

	/** Original filename (with extension) derived when first fetched. */
	@Column(DataType.STRING)
	declare fileName: string | null;
}
