import {
	Model,
	Table,
	Column,
	DataType,
	PrimaryKey,
	Default,
	AllowNull,
	IsLowercase,
	Length,
	Is,
	HasMany,
	HasOne,
	BelongsTo,
} from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import type { SerializedModel } from 'types';
import { CollectionKind, ReadNextPreviewSize } from 'types';
import { CollectionLayout } from 'utils/layout';
import {
	CollectionAttribution,
	SubmissionWorkflow,
	CollectionPub,
	Member,
	Page,
	CrossrefDepositRecord,
	ScopeSummary,
	Community,
} from '../models';

@Table
export class Collection extends Model<
	InferAttributes<Collection>,
	InferCreationAttributes<Collection>
> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	// TODO: Make this `AllowNull(false)`. Never is a collection without a title, but
	// technically this is nullable in the database.
	@Column(DataType.TEXT)
	title!: string;

	@AllowNull(false)
	@IsLowercase
	@Length({ min: 1, max: 280 })
	@Is(/^[a-zA-Z0-9-]+$/)
	@Column(DataType.TEXT)
	slug!: string;

	@Column(DataType.TEXT)
	avatar!: string | null;

	@Column(DataType.BOOLEAN)
	isRestricted!: boolean | null;

	@Column(DataType.BOOLEAN)
	isPublic!: boolean | null;

	@Column(DataType.STRING)
	viewHash!: string | null;

	@Column(DataType.STRING)
	editHash!: string | null;

	// TODO: Add validation for this field
	@Column(DataType.JSONB)
	metadata!: Record<string, any> | null;

	// TODO: Add validation for this field
	@Column(DataType.TEXT)
	kind!: CollectionKind | null;

	@Column(DataType.TEXT)
	doi!: string | null;

	@Default('choose-best')
	@Column(DataType.ENUM('none', 'minimal', 'medium', 'choose-best'))
	readNextPreviewSize!: CreationOptional<ReadNextPreviewSize>;

	// TODO: Add validation for this field
	@AllowNull(false)
	@Default({})
	@Column(DataType.JSONB)
	layout!: CreationOptional<CollectionLayout>;

	@AllowNull(false)
	@Default(false)
	@Column(DataType.BOOLEAN)
	layoutAllowsDuplicatePubs!: CreationOptional<boolean>;

	@Column(DataType.UUID)
	pageId!: string | null;

	// TODO: Make this `AllowNull(false)`. Never is a collection without a communityId, but
	// technically this is nullable in the database.
	@Column(DataType.UUID)
	communityId!: string;

	@Column(DataType.UUID)
	scopeSummaryId!: string | null;

	@Column(DataType.UUID)
	crossrefDepositRecordId!: string | null;

	@HasMany(() => CollectionAttribution, {
		onDelete: 'CASCADE',
		as: 'attributions',
		foreignKey: 'collectionId',
	})
	attributions?: CollectionAttribution[];

	@HasOne(() => SubmissionWorkflow, { as: 'submissionWorkflow', foreignKey: 'collectionId' })
	submissionWorkflow?: SubmissionWorkflow;

	@HasMany(() => CollectionPub, { as: 'collectionPubs', foreignKey: 'collectionId' })
	collectionPubs?: CollectionPub[];

	@HasMany(() => Member, { as: 'members', foreignKey: 'collectionId' })
	members?: Member[];

	@BelongsTo(() => Page, { as: 'page', foreignKey: 'pageId' })
	page?: Page;

	@BelongsTo(() => CrossrefDepositRecord, {
		as: 'crossrefDepositRecord',
		foreignKey: 'crossrefDepositRecordId',
		onDelete: 'SET NULL',
	})
	crossrefDepositRecord?: CrossrefDepositRecord;

	@BelongsTo(() => ScopeSummary, {
		as: 'scopeSummary',
		foreignKey: 'scopeSummaryId',
		onDelete: 'SET NULL',
	})
	scopeSummary?: ScopeSummary;

	@BelongsTo(() => Community, { as: 'community', foreignKey: 'communityId' })
	community?: Community;
}
