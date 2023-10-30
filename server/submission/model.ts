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
	declare id: CreationOptional<string>;

	// TODO: This should be an ENUM
	@AllowNull(false)
	@Column(DataType.TEXT)
	declare status: SubmissionStatus;

	@Column(DataType.DATE)
	declare submittedAt: Date | null;

	@AllowNull(false)
	@Column(DataType.UUID)
	declare submissionWorkflowId: string;

	@AllowNull(false)
	@Column(DataType.UUID)
	declare pubId: string;

	/**
	 * TODO: add validation and better type for abstract
	 * Should probably be DocJSON
	 */
	@Column(DataType.JSONB)
	declare abstract: DocJson | null;

	@BelongsTo(() => Pub, { onDelete: 'CASCADE', as: 'pub', foreignKey: 'pubId' })
	declare pub?: Pub;

	@BelongsTo(() => SubmissionWorkflow, {
		onDelete: 'CASCADE',
		as: 'submissionWorkflow',
		foreignKey: 'submissionWorkflowId',
	})
	declare submissionWorkflow?: SubmissionWorkflow;
}
