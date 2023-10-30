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
	declare id: CreationOptional<string>;

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare title: string;

	@Column(DataType.UUID)
	declare collectionId: string | null;

	@AllowNull(false)
	@Column(DataType.BOOLEAN)
	declare enabled: boolean;

	// TODO: Add validation for this
	@AllowNull(false)
	@Column(DataType.JSONB)
	declare instructionsText: DocJson;

	// TODO: Add validation for this
	@AllowNull(false)
	@Column(DataType.JSONB)
	declare acceptedText: DocJson;

	// TODO: Add validation for this
	@AllowNull(false)
	@Column(DataType.JSONB)
	declare declinedText: DocJson;

	// TODO: Add validation for this
	@AllowNull(false)
	@Column(DataType.JSONB)
	declare receivedEmailText: DocJson;

	// TODO: Add validation for this
	@AllowNull(false)
	@Column(DataType.JSONB)
	declare introText: DocJson;

	// TODO: Add validation for this
	@AllowNull(false)
	@Default([])
	@Column(DataType.JSONB)
	declare targetEmailAddresses: CreationOptional<string[]>;

	@AllowNull(false)
	@Default(false)
	@Column(DataType.BOOLEAN)
	declare requireAbstract: CreationOptional<boolean>;

	@AllowNull(false)
	@Default(false)
	@Column(DataType.BOOLEAN)
	declare requireDescription: CreationOptional<boolean>;

	@HasMany(() => Submission, { as: 'submissions', foreignKey: 'submissionWorkflowId' })
	declare submissions?: Submission[];

	@BelongsTo(() => Collection, { as: 'collection', foreignKey: 'collectionId' })
	declare collection?: Collection;
}
