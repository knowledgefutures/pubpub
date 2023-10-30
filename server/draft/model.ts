import {
	Model,
	Table,
	Column,
	DataType,
	PrimaryKey,
	Default,
	AllowNull,
	//	HasOne,
} from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import type { SerializedModel } from 'types';
// import { Pub } from '../models';

@Table
export class Draft extends Model<InferAttributes<Draft>, InferCreationAttributes<Draft>> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@Column(DataType.DATE)
	declare latestKeyAt: Date | null;

	@AllowNull(false)
	@Column(DataType.STRING)
	declare firebasePath: string;

	// @HasOne(() => Pub, { as: 'pub', foreignKey: 'draftId' })
	// pub?: Pub;
}
