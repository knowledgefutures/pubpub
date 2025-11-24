import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';

import type { DocJson, SerializedModel } from 'types';

import {
	AllowNull,
	Column,
	DataType,
	Default,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';

@Table
export class Doc extends Model<InferAttributes<Doc>, InferCreationAttributes<Doc>> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	// TODO: add validation for content
	@AllowNull(false)
	@Column(DataType.JSONB)
	declare content: DocJson;
}
