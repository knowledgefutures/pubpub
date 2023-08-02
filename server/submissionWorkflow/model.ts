import {
	Model,
	Table,
	Column,
	DataType,
	PrimaryKey,
	Default,
	AllowNull,
	HasMany,
	BelongsTo,
} from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import type { SerializedModel } from 'types';
import { DocJson } from 'types';
import { Submission, Collection } from '../models';

@Table
export class SubmissionWorkflow extends Model<
	InferAttributes<SubmissionWorkflow>,
	InferCreationAttributes<SubmissionWorkflow>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@AllowNull(false)
	@Column(DataType.TEXT)
	title!: string;

	@Column(DataType.UUID)
	collectionId!: string | null;

	@AllowNull(false)
	@Column(DataType.BOOLEAN)
	enabled!: boolean;

	// TODO: Add validation for this
	@AllowNull(false)
	@Column(DataType.JSONB)
	instructionsText!: DocJson;

	// TODO: Add validation for this
	@AllowNull(false)
	@Column(DataType.JSONB)
	acceptedText!: DocJson;

	// TODO: Add validation for this
	@AllowNull(false)
	@Column(DataType.JSONB)
	declinedText!: DocJson;

	// TODO: Add validation for this
	@AllowNull(false)
	@Column(DataType.JSONB)
	receivedEmailText!: DocJson;

	// TODO: Add validation for this
	@AllowNull(false)
	@Column(DataType.JSONB)
	introText!: DocJson;

	// TODO: Add validation for this
	@AllowNull(false)
	@Default([])
	@Column(DataType.JSONB)
	targetEmailAddresses!: CreationOptional<string[]>;

	@AllowNull(false)
	@Default(false)
	@Column(DataType.BOOLEAN)
	requireAbstract!: CreationOptional<boolean>;

	@AllowNull(false)
	@Default(false)
	@Column(DataType.BOOLEAN)
	requireDescription!: CreationOptional<boolean>;

	@HasMany(() => Submission, { as: 'submissions', foreignKey: 'submissionWorkflowId' })
	submissions?: Submission[];

	@BelongsTo(() => Collection, { as: 'collection', foreignKey: 'collectionId' })
	collection?: Collection;
}
