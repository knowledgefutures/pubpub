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
	declare id: CreationOptional<string>;

	// TODO: Make this `AllowNull(false)`. Never is a collection without a title, but
	// technically this is nullable in the database.
	@Column(DataType.TEXT)
	declare title: string;

	@AllowNull(false)
	@IsLowercase
	@Length({ min: 1, max: 280 })
	@Is(/^[a-zA-Z0-9-]+$/)
	@Column(DataType.TEXT)
	declare slug: string;

	@Column(DataType.TEXT)
	declare avatar: string | null;

	@Column(DataType.BOOLEAN)
	declare isRestricted: boolean | null;

	@Column(DataType.BOOLEAN)
	declare isPublic: boolean | null;

	@Column(DataType.STRING)
	declare viewHash: string | null;

	@Column(DataType.STRING)
	declare editHash: string | null;

	// TODO: Add validation for this field
	@Column(DataType.JSONB)
	declare metadata: Record<string, any> | null;

	// TODO: Add validation for this field
	@Column(DataType.TEXT)
	declare kind: CollectionKind | null;

	@Column(DataType.TEXT)
	declare doi: string | null;

	@Default('choose-best')
	@Column(DataType.ENUM('none', 'minimal', 'medium', 'choose-best'))
	declare readNextPreviewSize: CreationOptional<ReadNextPreviewSize>;

	// TODO: Add validation for this field
	@AllowNull(false)
	@Default({})
	@Column(DataType.JSONB)
	declare layout: CreationOptional<CollectionLayout>;

	@AllowNull(false)
	@Default(false)
	@Column(DataType.BOOLEAN)
	declare layoutAllowsDuplicatePubs: CreationOptional<boolean>;

	@Column(DataType.UUID)
	declare pageId: string | null;

	// TODO: Make this `AllowNull(false)`. Never is a collection without a communityId, but
	// technically this is nullable in the database.
	@Column(DataType.UUID)
	declare communityId: string;

	@Column(DataType.UUID)
	declare scopeSummaryId: string | null;

	@Column(DataType.UUID)
	declare crossrefDepositRecordId: string | null;

	@HasMany(() => CollectionAttribution, {
		onDelete: 'CASCADE',
		as: 'attributions',
		foreignKey: 'collectionId',
	})
	declare attributions?: CollectionAttribution[];

	@HasOne(() => SubmissionWorkflow, { as: 'submissionWorkflow', foreignKey: 'collectionId' })
	declare submissionWorkflow?: SubmissionWorkflow;

	@HasMany(() => CollectionPub, { as: 'collectionPubs', foreignKey: 'collectionId' })
	declare collectionPubs?: CollectionPub[];

	@HasMany(() => Member, { as: 'members', foreignKey: 'collectionId' })
	declare members?: Member[];

	@BelongsTo(() => Page, { as: 'page', foreignKey: 'pageId' })
	declare page?: Page;

	@BelongsTo(() => CrossrefDepositRecord, {
		as: 'crossrefDepositRecord',
		foreignKey: 'crossrefDepositRecordId',
		onDelete: 'SET NULL',
	})
	declare crossrefDepositRecord?: CrossrefDepositRecord;

	@BelongsTo(() => ScopeSummary, {
		as: 'scopeSummary',
		foreignKey: 'scopeSummaryId',
		onDelete: 'SET NULL',
	})
	declare scopeSummary?: ScopeSummary;

	@BelongsTo(() => Community, { as: 'community', foreignKey: 'communityId' })
	declare community?: Community;
}
