import {
	Model,
	Table,
	Column,
	DataType,
	PrimaryKey,
	Default,
	BelongsTo,
} from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { Pub } from '../models';

@Table
class PubVersion extends Model<InferAttributes<PubVersion>, InferCreationAttributes<PubVersion>> {
	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@Column(DataType.INTEGER)
	historyKey?: number | null;

	@Column(DataType.UUID)
	pubId?: string | null;

	@BelongsTo(() => Pub, { onDelete: 'CASCADE', as: 'pub', foreignKey: 'pubId' })
	// 	pub?: Pub;
	pub?: any;
}

export const PubVersionAnyModel = PubVersion as any;
