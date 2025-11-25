import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';

import type { SerializedModel } from 'types';

import {
	AllowNull,
	BelongsTo,
	Column,
	DataType,
	Default,
	ForeignKey,
	IsEmail,
	IsLowercase,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';

import { User } from '../models';

@Table
export class EmailChangeToken extends Model<
	InferAttributes<EmailChangeToken>,
	InferCreationAttributes<EmailChangeToken>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@AllowNull(false)
	@ForeignKey(() => User)
	@Column(DataType.UUID)
	declare userId: string;

	@AllowNull(false)
	@IsLowercase
	@IsEmail
	@Column(DataType.TEXT)
	declare newEmail: string;

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare token: string;

	@AllowNull(false)
	@Column(DataType.DATE)
	declare expiresAt: Date;

	@Default(null)
	@AllowNull(true)
	@Column(DataType.DATE)
	declare usedAt: CreationOptional<Date | null>;

	@BelongsTo(() => User, { onDelete: 'CASCADE', as: 'user', foreignKey: 'userId' })
	declare user?: User;
}
