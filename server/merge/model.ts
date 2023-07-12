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
import { User } from '../models';

@Table
class Merge extends Model<InferAttributes<Merge>, InferCreationAttributes<Merge>> {
	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@Column(DataType.JSONB)
	noteContent?: object | null;

	@Column(DataType.TEXT)
	noteText?: string | null;

	@AllowNull(false)
	@Column(DataType.UUID)
	userId!: string;

	@AllowNull(false)
	@Column(DataType.UUID)
	pubId!: string;

	@BelongsTo(() => User, { onDelete: 'CASCADE', as: 'user', foreignKey: 'userId' })
	// 	user?: User;
	user?: any;
}

export const MergeAnyModel = Merge as any;
