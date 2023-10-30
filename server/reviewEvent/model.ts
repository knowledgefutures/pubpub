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
import type { SerializedModel } from 'types';
import { User } from '../models';

@Table
export class ReviewEvent extends Model<
	InferAttributes<ReviewEvent>,
	InferCreationAttributes<ReviewEvent>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@Column(DataType.STRING)
	declare type: string | null;

	@Column(DataType.JSONB)
	declare data: object | null;

	@AllowNull(false)
	@Column(DataType.UUID)
	declare userId: string;

	@AllowNull(false)
	@Column(DataType.UUID)
	declare pubId: string;

	@AllowNull(false)
	@Column(DataType.UUID)
	declare reviewId: string;

	@BelongsTo(() => User, { onDelete: 'CASCADE', as: 'user', foreignKey: 'userId' })
	declare user?: User;
}
