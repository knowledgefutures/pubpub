import {
	Model,
	Table,
	Column,
	DataType,
	PrimaryKey,
	Default,
	AllowNull,
	IsLowercase,
	IsEmail,
	Unique,
} from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

@Table
class Signup extends Model<InferAttributes<Signup>, InferCreationAttributes<Signup>> {
	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@AllowNull(false)
	@IsLowercase
	@IsEmail
	@Unique
	@Column(DataType.TEXT)
	email!: string;

	@Column(DataType.TEXT)
	hash?: string | null;

	@Column(DataType.INTEGER)
	count?: number | null;

	@Column(DataType.BOOLEAN)
	completed?: boolean | null;

	@Column(DataType.UUID)
	communityId?: string | null;
}

export const SignupAnyModel = Signup as any;
