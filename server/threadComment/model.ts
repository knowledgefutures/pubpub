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
import { DocJson } from 'types';
import { User, Commenter } from '../models';

@Table
export class ThreadComment extends Model<
	InferAttributes<ThreadComment>,
	InferCreationAttributes<ThreadComment>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@Column(DataType.TEXT)
	text!: string | null;

	// TODO: Add validation for this
	@Column(DataType.JSONB)
	content!: DocJson | null;

	@Column(DataType.UUID)
	userId!: string | null;

	@AllowNull(false)
	@Column(DataType.UUID)
	threadId!: string;

	@Column(DataType.UUID)
	commenterId!: string | null;

	@BelongsTo(() => User, { onDelete: 'CASCADE', as: 'author', foreignKey: 'userId' })
	author?: User;

	@BelongsTo(() => Commenter, { onDelete: 'CASCADE', as: 'commenter', foreignKey: 'commenterId' })
	commenter?: Commenter;
}
