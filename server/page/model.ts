import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';

import type { SerializedModel } from 'types';
import type { LayoutBlock } from 'utils/layout';

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

import { Community } from '../models';

@Table
export class Page extends Model<InferAttributes<Page>, InferCreationAttributes<Page>> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare title: string;

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare slug: string;

	@Column(DataType.TEXT)
	declare description: string | null;

	@Column(DataType.TEXT)
	declare avatar: string | null;

	@AllowNull(false)
	@Default(false)
	@Column(DataType.BOOLEAN)
	declare isPublic: CreationOptional<boolean>;

	@Column(DataType.BOOLEAN)
	declare isNarrowWidth: boolean | null;

	@Column(DataType.TEXT)
	declare viewHash: string | null;

	// TODO: Add @IsArray validation
	@AllowNull(false)
	@Column(DataType.JSONB)
	declare layout: LayoutBlock[];

	@AllowNull(false)
	@Default(false)
	@Column(DataType.BOOLEAN)
	declare layoutAllowsDuplicatePubs: CreationOptional<boolean>;

	@AllowNull(false)
	@Index
	@Column(DataType.UUID)
	declare communityId: string;

	@BelongsTo(() => Community, { onDelete: 'CASCADE', as: 'community', foreignKey: 'communityId' })
	declare community?: Community;
}
