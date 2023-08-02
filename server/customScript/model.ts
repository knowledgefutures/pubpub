import { Model, Table, Column, DataType, PrimaryKey, Default } from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import type { SerializedModel } from 'types';

@Table
export class CustomScript extends Model<
	InferAttributes<CustomScript>,
	InferCreationAttributes<CustomScript>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@Column(DataType.UUID)
	communityId!: string | null;

	@Column(DataType.STRING)
	type!: string | null;

	@Column(DataType.TEXT)
	content!: string | null;
}
