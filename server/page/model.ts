import {
	Model,
	Table,
	Column,
	DataType,
	PrimaryKey,
	Default,
	AllowNull,
	BelongsTo,
} from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import type { LayoutBlock } from 'utils/layout';
import { Community } from '../models';

@Table
class Page extends Model<InferAttributes<Page>, InferCreationAttributes<Page>> {
	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@AllowNull(false)
	@Column(DataType.TEXT)
	title!: string;

	@AllowNull(false)
	@Column(DataType.TEXT)
	slug!: string;

	@Column(DataType.TEXT)
	description?: string | null;

	@Column(DataType.TEXT)
	avatar?: string | null;

	@AllowNull(false)
	@Default(false)
	@Column(DataType.BOOLEAN)
	isPublic!: CreationOptional<boolean>;

	@Column(DataType.BOOLEAN)
	isNarrowWidth?: boolean | null;

	@Column(DataType.TEXT)
	viewHash?: string | null;

	// TODO: Add @IsArray validation
	@AllowNull(false)
	@Column(DataType.JSONB)
	layout!: LayoutBlock[];

	@AllowNull(false)
	@Default(false)
	@Column(DataType.BOOLEAN)
	layoutAllowsDuplicatePubs!: CreationOptional<boolean>;

	@AllowNull(false)
	@Column(DataType.UUID)
	communityId!: string;

	@BelongsTo(() => Community, { onDelete: 'CASCADE', as: 'community', foreignKey: 'communityId' })
	// 	community?: Community;
	community?: any;
}

export const PageAnyModel = Page as any;
