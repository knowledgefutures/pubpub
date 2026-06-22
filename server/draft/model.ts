import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';

import type { SerializedModel } from 'types';

import { Column, DataType, Default, HasOne, Model, PrimaryKey, Table } from 'sequelize-typescript';

import { DraftCheckpoint } from 'server/draftCheckpoint/model';

@Table
export class Draft extends Model<InferAttributes<Draft>, InferCreationAttributes<Draft>> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@Column(DataType.DATE)
	declare latestKeyAt: Date | null;

	// kept nullable during Firebase→PitterPatter migration; will be removed after full cutover
	@Column(DataType.STRING)
	declare firebasePath: string | null;

	@Default(0)
	@Column(DataType.INTEGER)
	declare version: CreationOptional<number>;

	@HasOne(() => DraftCheckpoint, { as: 'checkpoint', foreignKey: 'draftId' })
	declare checkpoint?: DraftCheckpoint;
}
