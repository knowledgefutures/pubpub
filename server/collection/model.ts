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
// import { CollectionKind, ReadNextPreviewSize } from 'types';
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
class Collection extends Model<InferAttributes<Collection>, InferCreationAttributes<Collection>> {
	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@Column(DataType.TEXT)
	title?: string | null;

	@AllowNull(false)
	@IsLowercase
	@Length({ min: 1, max: 280 })
	@Is(/^[a-zA-Z0-9-]+$/)
	@Column(DataType.TEXT)
	slug!: string;

	@Column(DataType.TEXT)
	avatar?: string | null;

	@Column(DataType.BOOLEAN)
	isRestricted?: boolean | null;

	@Column(DataType.BOOLEAN)
	isPublic?: boolean | null;

	@Column(DataType.STRING)
	viewHash?: string | null;

	@Column(DataType.STRING)
	editHash?: string | null;

	// TODO: Add validation for this field
	@Column(DataType.JSONB)
	// 	metadata?: Record<string, any> | null;
	metadata?: any;

	// TODO: Add validation for this field
	@Column(DataType.TEXT)
	// 	kind?: CollectionKind | null;
	kind?: any;

	@Column(DataType.TEXT)
	doi?: string | null;

	@Default('choose-best')
	@Column(DataType.ENUM('none', 'minimal', 'medium', 'choose-best'))
	// 	readNextPreviewSize?: CreationOptional<ReadNextPreviewSize | null>;
	readNextPreviewSize?: any;

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
	pageId?: string | null;

	@Column(DataType.UUID)
	communityId?: string | null;

	@Column(DataType.UUID)
	scopeSummaryId?: string | null;

	@Column(DataType.UUID)
	crossrefDepositRecordId?: string | null;

	@HasMany(() => CollectionAttribution, {
		onDelete: 'CASCADE',
		as: 'attributions',
		foreignKey: 'collectionId',
	})
	// 	attributions?: CollectionAttribution[];
	attributions?: any;

	@HasOne(() => SubmissionWorkflow, { as: 'submissionWorkflow', foreignKey: 'collectionId' })
	// 	submissionWorkflow?: SubmissionWorkflow;
	submissionWorkflow?: any;

	@HasMany(() => CollectionPub, { as: 'collectionPubs', foreignKey: 'collectionId' })
	// 	collectionPubs?: CollectionPub[];
	collectionPubs?: any;

	@HasMany(() => Member, { as: 'members', foreignKey: 'collectionId' })
	// 	members?: Member[];
	members?: any;

	@BelongsTo(() => Page, { as: 'page', foreignKey: 'pageId' })
	// 	page?: Page;
	page?: any;

	@BelongsTo(() => CrossrefDepositRecord, {
		as: 'crossrefDepositRecord',
		foreignKey: 'crossrefDepositRecordId',
		onDelete: 'SET NULL',
	})
	// 	crossrefDepositRecord?: CrossrefDepositRecord;
	crossrefDepositRecord?: any;

	@BelongsTo(() => ScopeSummary, {
		as: 'scopeSummary',
		foreignKey: 'scopeSummaryId',
		onDelete: 'SET NULL',
	})
	// 	scopeSummary?: ScopeSummary;
	scopeSummary?: any;

	@BelongsTo(() => Community, { as: 'community', foreignKey: 'communityId' })
	// 	community?: Community;
	community?: any;
}

export const CollectionAnyModel = Collection as any;
