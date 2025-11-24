import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';

import type { SerializedModel } from 'types';

import {
	AllowNull,
	BelongsTo,
	Column,
	DataType,
	Default,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';

import { WorkerTask } from '../models';

@Table
export class Export extends Model<InferAttributes<Export>, InferCreationAttributes<Export>> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@AllowNull(false)
	@Column(DataType.STRING)
	declare format: string;

	@Column(DataType.STRING)
	declare url: string | null;

	@AllowNull(false)
	@Column(DataType.INTEGER)
	declare historyKey: number;

	@AllowNull(false)
	@Column(DataType.UUID)
	declare pubId: string;

	@Column(DataType.UUID)
	declare workerTaskId: string | null;

	@BelongsTo(() => WorkerTask, {
		onDelete: 'SET NULL',
		as: 'workerTask',
		foreignKey: 'workerTaskId',
	})
	declare workerTask?: WorkerTask;
}
