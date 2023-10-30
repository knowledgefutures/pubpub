import {
	Model,
	Table,
	Column,
	DataType,
	PrimaryKey,
	Default,
	IsLowercase,
	IsEmail,
	AllowNull,
	BelongsTo,
} from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import type { SerializedModel } from 'types';
import { User } from '../models';

@Table
export class ThreadUser extends Model<
	InferAttributes<ThreadUser>,
	InferCreationAttributes<ThreadUser>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@Default('viewer')
	@Column(DataType.ENUM('viewer', 'reviewer'))
	declare type: CreationOptional<string | null>;

	@IsLowercase
	@IsEmail
	@Column(DataType.TEXT)
	declare email: string | null;

	@Column(DataType.TEXT)
	declare hash: string | null;

	@Column(DataType.UUID)
	declare userId: string | null;

	@AllowNull(false)
	@Column(DataType.UUID)
	declare threadId: string;

	@BelongsTo(() => User, { onDelete: 'CASCADE', as: 'user', foreignKey: 'userId' })
	declare user?: User;
}
