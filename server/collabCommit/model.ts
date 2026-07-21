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
export class CollabCommit extends Model<
	InferAttributes<CollabCommit>,
	InferCreationAttributes<CollabCommit>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@AllowNull(false)
	@Index({ unique: true, name: 'collab_commits_draft_version_unique' })
	@Index({ name: 'collab_commits_draft_ref_idx' })
	@Column(DataType.UUID)
	declare draftId: string;

	@AllowNull(false)
	@Index({ unique: true, name: 'collab_commits_draft_version_unique' })
	@Column(DataType.INTEGER)
	declare version: number;

	@AllowNull(false)
	@Index({ name: 'collab_commits_draft_ref_idx' })
	@Column(DataType.TEXT)
	declare ref: string;

	@AllowNull(false)
	@Column(DataType.JSONB)
	declare steps: Record<string, any>[];

	@BelongsTo(() => Draft, { as: 'draft', foreignKey: 'draftId', onDelete: 'CASCADE' })
	declare draft?: Draft;
}
