import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';

import type { SerializedModel, VisibilityAccess } from 'types';

import {
	BelongsToMany,
	Column,
	DataType,
	Default,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';

import { User, VisibilityUser } from '../models';

@Table
export class Visibility extends Model<
	InferAttributes<Visibility>,
	InferCreationAttributes<Visibility>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@Default('private')
	@Column(DataType.ENUM('private', 'members', 'public'))
	declare access: CreationOptional<VisibilityAccess | null>;

	@BelongsToMany(() => User, {
		as: 'users',
		through: () => VisibilityUser,
		foreignKey: 'visibilityId',
	})
	declare users?: VisibilityUser[];
}
