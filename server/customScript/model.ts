import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';

import type { SerializedModel } from 'types';

import { Column, DataType, Default, Index, Model, PrimaryKey, Table } from 'sequelize-typescript';

@Table
export class CustomScript extends Model<
	InferAttributes<CustomScript>,
	InferCreationAttributes<CustomScript>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@Index
	@Column(DataType.UUID)
	declare communityId: string | null;

	@Column(DataType.STRING)
	declare type: string | null;

	@Column(DataType.TEXT)
	declare content: string | null;
}
