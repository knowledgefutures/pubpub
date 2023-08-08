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
export class Merge extends Model<InferAttributes<Merge>, InferCreationAttributes<Merge>> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@Column(DataType.JSONB)
	noteContent!: object | null;

	@Column(DataType.TEXT)
	noteText!: string | null;

	@AllowNull(false)
	@Column(DataType.UUID)
	userId!: string;

	@AllowNull(false)
	@Column(DataType.UUID)
	pubId!: string;

	@BelongsTo(() => User, { onDelete: 'CASCADE', as: 'user', foreignKey: 'userId' })
	user?: User;
}
