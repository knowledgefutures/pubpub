import {
	Model,
	Table,
	Column,
	DataType,
	PrimaryKey,
	Default,
	AllowNull,
	Index,
} from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

@Table
class DiscussionAnchor extends Model<
	InferAttributes<DiscussionAnchor>,
	InferCreationAttributes<DiscussionAnchor>
> {
	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@AllowNull(false)
	@Column(DataType.BOOLEAN)
	isOriginal!: boolean;

	@Index({ using: 'BTREE' })
	@AllowNull(false)
	@Column(DataType.UUID)
	discussionId!: string;

	@AllowNull(false)
	@Column(DataType.INTEGER)
	historyKey!: number;

	// TODO: Add validation for selection
	@Column(DataType.JSONB)
	selection?: null | { type: 'text'; anchor: number; head: number };

	@AllowNull(false)
	@Column(DataType.TEXT)
	originalText!: string;

	@AllowNull(false)
	@Column(DataType.TEXT)
	originalTextPrefix!: string;

	@AllowNull(false)
	@Column(DataType.TEXT)
	originalTextSuffix!: string;
}

export const DiscussionAnchorAnyModel = DiscussionAnchor as any;
