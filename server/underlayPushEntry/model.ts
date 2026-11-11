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

import { Pub } from '../pub/model';
import { UnderlayIntegration } from '../underlayIntegration/model';

/** `recordHashes` shape: recordId → { type, hash } for the Pub, its Releases, and its Edges. */
export type UnderlayPushEntryRecordHashes = Record<string, { type: string; hash: string }>;

/**
 * Per-pub snapshot of the last successful Underlay push, keyed by (integration, pub). Lets a push
 * skip the expensive work (loading the ProseMirror doc, rendering HTML, fetching assets) for pubs
 * whose content is unchanged since the last push, reusing the cached record + file hashes instead.
 *
 * An entry is a cache HIT iff `pubUpdatedAt`, `latestReleaseHistoryKey`, `optionsSignature`, and
 * `facetsSignature` all still match; otherwise the pub is fully re-mapped and its entry replaced.
 * Entries are written only after a successful commit, so a failed push never poisons the cache.
 */
@Table
export class UnderlayPushEntry extends Model<
	InferAttributes<UnderlayPushEntry>,
	InferCreationAttributes<UnderlayPushEntry>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@Index({ unique: true, name: 'underlay_push_entries_integration_id_pub_id' })
	@AllowNull(false)
	@Column(DataType.UUID)
	declare underlayIntegrationId: string;

	@BelongsTo(() => UnderlayIntegration, {
		onDelete: 'CASCADE',
		as: 'underlayIntegration',
		foreignKey: 'underlayIntegrationId',
	})
	declare underlayIntegration?: UnderlayIntegration;

	@Index({ unique: true, name: 'underlay_push_entries_integration_id_pub_id' })
	@AllowNull(false)
	@Column(DataType.UUID)
	declare pubId: string;

	@BelongsTo(() => Pub, { onDelete: 'CASCADE', as: 'pub', foreignKey: 'pubId' })
	declare pub?: Pub;

	/** recordId → { type, hash } for the Pub record, its Release records, and its Edge records. */
	@AllowNull(false)
	@Column(DataType.JSONB)
	declare recordHashes: UnderlayPushEntryRecordHashes;

	/** Bare hex hashes of the files (rendered HTML, assets, PDFs) referenced by this pub's records. */
	@Default([])
	@Column(DataType.JSONB)
	declare fileHashes: CreationOptional<string[]>;

	/** historyKey of the pub's latest release at cache time; null if the pub had no releases. */
	@Column(DataType.INTEGER)
	declare latestReleaseHistoryKey: number | null;

	/** The pub's `updatedAt` at cache time (cheap change signal). */
	@AllowNull(false)
	@Column(DataType.DATE)
	declare pubUpdatedAt: Date;

	/** Hash of the push options (include toggles) in effect; a change invalidates every entry. */
	@AllowNull(false)
	@Column(DataType.STRING)
	declare optionsSignature: string;

	/**
	 * Hash of the pub's fully-resolved facet stack (the community→collection→pub cascade that drives
	 * rendered HTML). Facet edits change rendered content without touching `pubUpdatedAt` or creating a
	 * release, so this signal is what invalidates a pub whose facets changed at any scope in its
	 * cascade. Defaults to '' so pre-existing rows (never a real signature) always miss and re-render.
	 */
	@Default('')
	@AllowNull(false)
	@Column(DataType.STRING)
	declare facetsSignature: CreationOptional<string>;
}
