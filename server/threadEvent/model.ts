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
export class ThreadEvent extends Model<
	InferAttributes<ThreadEvent>,
	InferCreationAttributes<ThreadEvent>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@Column(DataType.STRING)
	declare type: string | null;

	// TODO: Add validation for this
	@Column(DataType.JSONB)
	declare data: Record<string, any> | null;

	@AllowNull(false)
	@Column(DataType.UUID)
	declare userId: string;

	@AllowNull(false)
	@Column(DataType.UUID)
	declare threadId: string;

	@BelongsTo(() => User, { onDelete: 'CASCADE', as: 'user', foreignKey: 'userId' })
	declare user?: User;
}
