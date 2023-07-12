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

@Table
class UserDismissable extends Model<
	InferAttributes<UserDismissable>,
	InferCreationAttributes<UserDismissable>
> {
	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@AllowNull(false)
	@Column(DataType.STRING)
	key!: string;

	@Index({ using: 'BTREE' })
	@AllowNull(false)
	@Column(DataType.UUID)
	userId!: string;
}

export const UserDismissableAnyModel = UserDismissable as any;
