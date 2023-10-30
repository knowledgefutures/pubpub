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
	declare id: CreationOptional<string>;

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare type: string;

	// TODO: Add validation for input and enrich with type information
	@Column(DataType.JSONB)
	declare input: object | null;

	@Column(DataType.BOOLEAN)
	declare isProcessing: boolean | null;

	@Column(DataType.INTEGER)
	declare attemptCount: number | null;

	// TODO: Add validation for error and enrich with type information
	@Column(DataType.JSONB)
	declare error: string | null;

	// TODO: Add validation for output and enrich with type information
	@Column(DataType.JSONB)
	declare output: object | null;

	@Column(DataType.INTEGER)
	declare priority: number | null;
}
