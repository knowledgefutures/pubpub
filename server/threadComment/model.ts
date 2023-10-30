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
	declare id: CreationOptional<string>;

	@Column(DataType.TEXT)
	declare text: string | null;

	// TODO: Add validation for this
	@Column(DataType.JSONB)
	declare content: DocJson | null;

	@Column(DataType.UUID)
	declare userId: string | null;

	@AllowNull(false)
	@Column(DataType.UUID)
	declare threadId: string;

	@Column(DataType.UUID)
	declare commenterId: string | null;

	@BelongsTo(() => User, { onDelete: 'CASCADE', as: 'author', foreignKey: 'userId' })
	declare author?: User;

	@BelongsTo(() => Commenter, { onDelete: 'CASCADE', as: 'commenter', foreignKey: 'commenterId' })
	declare commenter?: Commenter;
}
