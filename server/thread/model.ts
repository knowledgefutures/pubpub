import { Model, Table, Column, DataType, PrimaryKey, Default, HasMany } from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import type { SerializedModel } from 'types';
import { ThreadComment, ThreadEvent } from '../models';

@Table
export class Thread extends Model<InferAttributes<Thread>, InferCreationAttributes<Thread>> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@Column(DataType.BOOLEAN)
	isLocked!: boolean | null;

	@HasMany(() => ThreadComment, { onDelete: 'CASCADE', as: 'comments', foreignKey: 'threadId' })
	comments?: ThreadComment[];

	@HasMany(() => ThreadEvent, { onDelete: 'CASCADE', as: 'events', foreignKey: 'threadId' })
	events?: ThreadEvent[];
}
