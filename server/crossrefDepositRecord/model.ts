import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';

import type { SerializedModel } from 'types';
import type { DepositStatus } from 'utils/crossref/depositStatus';

import { Column, DataType, Default, Index, Model, PrimaryKey, Table } from 'sequelize-typescript';

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

	/**
	 * status of the deposit for doily
	 */
	@Column(DataType.TEXT)
	declare status: CreationOptional<DepositStatus | null>;

	/** Doily's deposit id, so a webhook can find this row without matching on DOI. Necessary in case of failures/edited doily doi */
	@Index
	@Column(DataType.TEXT)
	declare doilyDepositId: CreationOptional<string | null>;

	/** allows us to retain the DOI even if the pub's DOI is edited underneath us */
	@Index
	@Column(DataType.TEXT)
	declare doi: CreationOptional<string | null>;

	@Column(DataType.TEXT)
	declare error: CreationOptional<string | null>;

	@Column(DataType.DATE)
	declare lastCheckedAt: CreationOptional<Date | null>;

	/**
	 * When this DOI first registered, from Doily's firstRegisteredAt.
	 */
	@Column(DataType.DATE)
	declare firstRegisteredAt: CreationOptional<Date | null>;
}
