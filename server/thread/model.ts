import { Model, Table, Column, DataType, PrimaryKey, Default, HasMany } from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { ThreadComment, ThreadEvent } from '../models';

@Table
class Thread extends Model<InferAttributes<Thread>, InferCreationAttributes<Thread>> {
	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@Column(DataType.BOOLEAN)
	isLocked?: boolean | null;

	@HasMany(() => ThreadComment, { onDelete: 'CASCADE', as: 'comments', foreignKey: 'threadId' })
	// 	comments?: ThreadComment[];
	comments?: any;

	@HasMany(() => ThreadEvent, { onDelete: 'CASCADE', as: 'events', foreignKey: 'threadId' })
	// 	events?: ThreadEvent[];
	events?: any;
}

export const ThreadAnyModel = Thread as any;
