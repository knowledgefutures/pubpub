import {
	Model,
	Table,
	Column,
	DataType,
	PrimaryKey,
	Default,
	AllowNull,
	BelongsTo,
} from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import type { SerializedModel, DocJson, SubmissionStatus } from 'types';
import { Pub, SubmissionWorkflow } from '../models';

@Table
export class Submission extends Model<
	InferAttributes<Submission>,
	InferCreationAttributes<Submission>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	// TODO: This should be an ENUM
	@AllowNull(false)
	@Column(DataType.TEXT)
	status!: SubmissionStatus;

	@Column(DataType.DATE)
	submittedAt!: Date | null;

	@AllowNull(false)
	@Column(DataType.UUID)
	submissionWorkflowId!: string;

	@AllowNull(false)
	@Column(DataType.UUID)
	pubId!: string;

	/**
	 * TODO: add validation and better type for abstract
	 * Should probably be DocJSON
	 */
	@Column(DataType.JSONB)
	abstract!: DocJson | null;

	@BelongsTo(() => Pub, { onDelete: 'CASCADE', as: 'pub', foreignKey: 'pubId' })
	pub?: Pub;

	@BelongsTo(() => SubmissionWorkflow, {
		onDelete: 'CASCADE',
		as: 'submissionWorkflow',
		foreignKey: 'submissionWorkflowId',
	})
	submissionWorkflow?: SubmissionWorkflow;
}
