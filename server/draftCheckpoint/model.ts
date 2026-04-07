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

import { Draft } from '../models';

@Table
export class DraftCheckpoint extends Model<
	InferAttributes<DraftCheckpoint>,
	InferCreationAttributes<DraftCheckpoint>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@AllowNull(false)
	@Index
	@Column(DataType.UUID)
	declare draftId: string;

	// The history key this checkpoint represents (i.e. the doc state after applying
	// all changes up to and including this key)
	@AllowNull(false)
	@Column(DataType.INTEGER)
	declare historyKey: number;

	// The compressed doc JSON (same shape as Doc.content — a ProseMirror doc JSON)
	@AllowNull(false)
	@Column(DataType.JSONB)
	declare doc: Record<string, any>;

	// Timestamp of the change at this history key
	@Column(DataType.BIGINT)
	declare timestamp: number | null;

	// Firebase discussion positions at the time of cold storage, keyed by discussion ID.
	// Stored so they can be "thawed" back into Firebase when the draft is next loaded.
	@Column(DataType.JSONB)
	declare discussions: Record<string, any> | null;

	// Cumulative StepMap ranges from the latest release historyKey to this checkpoint's
	// historyKey. Used to map discussion anchors during release creation when the
	// original steps are no longer available in Firebase.
	// Shape: Array<number[]> — each inner array is a StepMap.ranges (triples of
	// [oldStart, oldSize, newSize]).
	@Column(DataType.JSONB)
	declare stepMaps: number[][] | null;

	// The history key that stepMaps cover up to. After cold storage thaw + editing,
	// the checkpoint's historyKey advances but stepMaps still only cover up to this key.
	// At release time, Firebase changes from stepMapToKey+1 → currentKey are composed
	// with the stored stepMaps.
	@Column(DataType.INTEGER)
	declare stepMapToKey: number | null;

	@BelongsTo(() => Draft, { as: 'draft', foreignKey: 'draftId', onDelete: 'CASCADE' })
	declare draft?: Draft;
}
