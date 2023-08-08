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
export class WorkerTask extends Model<
	InferAttributes<WorkerTask>,
	InferCreationAttributes<WorkerTask>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@AllowNull(false)
	@Column(DataType.TEXT)
	type!: string;

	// TODO: Add validation for input and enrich with type information
	@Column(DataType.JSONB)
	input!: object | null;

	@Column(DataType.BOOLEAN)
	isProcessing!: boolean | null;

	@Column(DataType.INTEGER)
	attemptCount!: number | null;

	// TODO: Add validation for error and enrich with type information
	@Column(DataType.JSONB)
	error!: string | null;

	// TODO: Add validation for output and enrich with type information
	@Column(DataType.JSONB)
	output!: object | null;

	@Column(DataType.INTEGER)
	priority!: number | null;
}
