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
// import { Pub } from '../models';

@Table
class Draft extends Model<InferAttributes<Draft>, InferCreationAttributes<Draft>> {
	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@Column(DataType.DATE)
	// 	latestKeyAt?: Date | null;
	latestKeyAt?: any;

	@AllowNull(false)
	@Column(DataType.STRING)
	firebasePath!: string;

	// @HasOne(() => Pub, { as: 'pub', foreignKey: 'draftId' })
	// 	// pub?: Pub;
	// pub?: any;
}

export const DraftAnyModel = Draft as any;
