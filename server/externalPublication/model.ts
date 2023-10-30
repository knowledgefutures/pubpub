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
import type { SerializedModel } from 'types';

@Table
export class ExternalPublication extends Model<
	InferAttributes<ExternalPublication>,
	InferCreationAttributes<ExternalPublication>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare title: string;

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare url: string;

	// TODO: add validation for contributors
	@Column(DataType.JSONB)
	declare contributors: string[] | null;

	@Column(DataType.TEXT)
	declare doi: string | null;

	@Column(DataType.TEXT)
	declare description: string | null;

	@Column(DataType.TEXT)
	declare avatar: string | null;

	@Column(DataType.DATE)
	declare publicationDate: string | null;
}
