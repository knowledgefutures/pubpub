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
import type { SerializedModel } from 'types';

@Table
export class DiscussionAnchor extends Model<
	InferAttributes<DiscussionAnchor>,
	InferCreationAttributes<DiscussionAnchor>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@AllowNull(false)
	@Column(DataType.BOOLEAN)
	declare isOriginal: boolean;

	@Index({ using: 'BTREE' })
	@AllowNull(false)
	@Column(DataType.UUID)
	declare discussionId: string;

	@AllowNull(false)
	@Column(DataType.INTEGER)
	declare historyKey: number;

	// TODO: Add validation for selection
	@Column(DataType.JSONB)
	declare selection: null | { type: 'text'; anchor: number; head: number };

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare originalText: string;

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare originalTextPrefix: string;

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare originalTextSuffix: string;
}
