import {
	Model,
	Table,
	Column,
	DataType,
	PrimaryKey,
	Default,
	BelongsToMany,
} from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
// import { VisibilityAccess } from 'types';
import { VisibilityUser, User } from '../models';

@Table
class Visibility extends Model<InferAttributes<Visibility>, InferCreationAttributes<Visibility>> {
	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@Default('private')
	@Column(DataType.ENUM('private', 'members', 'public'))
	// 	access?: CreationOptional<VisibilityAccess | null>;
	access?: any;

	@BelongsToMany(() => User, {
		as: 'users',
		through: () => VisibilityUser,
		foreignKey: 'visibilityId',
	})
	// 	users?: VisibilityUser[];
	users?: any;
}

export const VisibilityAnyModel = Visibility as any;
