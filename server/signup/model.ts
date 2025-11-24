import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';

import type { SerializedModel } from 'types';

import {
	AllowNull,
	Column,
	DataType,
	Default,
	IsEmail,
	IsLowercase,
	Model,
	PrimaryKey,
	Table,
	Unique,
} from 'sequelize-typescript';

@Table
export class Signup extends Model<InferAttributes<Signup>, InferCreationAttributes<Signup>> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@AllowNull(false)
	@IsLowercase
	@IsEmail
	@Unique
	@Column(DataType.TEXT)
	declare email: string;

	@Column(DataType.TEXT)
	declare hash: string | null;

	@Column(DataType.INTEGER)
	declare count: number | null;

	@Column(DataType.BOOLEAN)
	declare completed: boolean | null;

	@Column(DataType.UUID)
	declare communityId: string | null;
}
