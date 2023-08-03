import {
	Model,
	Table,
	Column,
	DataType,
	PrimaryKey,
	Default,
	AllowNull,
} from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { DocJson } from 'types';

@Table
class Doc extends Model<InferAttributes<Doc>, InferCreationAttributes<Doc>> {
	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	// TODO: add validation for content
	@AllowNull(false)
	@Column(DataType.JSONB)
	content!: DocJson;
}

export const DocAnyModel = Doc as any;
