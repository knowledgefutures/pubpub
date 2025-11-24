import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';

import type { SerializedModel } from 'types';

import { Column, DataType, Default, Model, PrimaryKey, Table } from 'sequelize-typescript';

@Table
export class CrossrefDepositRecord extends Model<
	InferAttributes<CrossrefDepositRecord>,
	InferCreationAttributes<CrossrefDepositRecord>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@Column(DataType.JSONB)
	declare depositJson: object | null;
}
