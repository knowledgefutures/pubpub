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
import type { SubmissionStatus } from 'types';
import { Pub, SubmissionWorkflow } from '../models';

@Table
class Submission extends Model<InferAttributes<Submission>, InferCreationAttributes<Submission>> {
	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	// TODO: This should be an ENUM
	@AllowNull(false)
	@Column(DataType.TEXT)
	status!: SubmissionStatus;

	@Column(DataType.DATE)
	// 	submittedAt?: Date | null;
	submittedAt?: any;

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
	abstract?: object | null;

	@BelongsTo(() => Pub, { onDelete: 'CASCADE', as: 'pub', foreignKey: 'pubId' })
	// 	pub?: Pub;
	pub?: any;

	@BelongsTo(() => SubmissionWorkflow, {
		onDelete: 'CASCADE',
		as: 'submissionWorkflow',
		foreignKey: 'submissionWorkflowId',
	})
	// 	submissionWorkflow?: SubmissionWorkflow;
	submissionWorkflow?: any;
}

export const SubmissionAnyModel = Submission as any;
