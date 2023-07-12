import { Model, Table, Column, DataType, PrimaryKey, Default } from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

@Table
class CrossrefDepositRecord extends Model<
	InferAttributes<CrossrefDepositRecord>,
	InferCreationAttributes<CrossrefDepositRecord>
> {
	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@Column(DataType.JSONB)
	depositJson?: object | null;
}

export const CrossrefDepositRecordAnyModel = CrossrefDepositRecord as any;
