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
	Unique,
	Index,
	HasMany,
	BelongsTo,
	HasOne,
} from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import type { SerializedModel } from 'types';
import {
	PubAttribution,
	CollectionPub,
	Community,
	Draft,
	Discussion,
	Export,
	ReviewNew,
	Member,
	Release,
	PubVersion,
	PubEdge,
	Submission,
	CrossrefDepositRecord,
	ScopeSummary,
} from '../models';

@Table
export class Pub extends Model<InferAttributes<Pub>, InferCreationAttributes<Pub>> {
	public declare toJSON: <M extends Model>(this: M) => SerializedModel<M>;

	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@AllowNull(false)
	@IsLowercase
	@Length({ min: 1, max: 280 })
	@Is(/^[a-zA-Z0-9-]+$/)
	@Unique
	@Column(DataType.TEXT)
	declare slug: string;

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare title: string;

	@Column(DataType.TEXT)
	declare htmlTitle: string | null;

	@Length({ min: 0, max: 280 })
	@Column(DataType.TEXT)
	declare description: string | null;

	@Length({ min: 0, max: 280 })
	@Column(DataType.TEXT)
	declare htmlDescription: string | null;

	@Column(DataType.TEXT)
	declare avatar: string | null;

	@Column(DataType.DATE)
	declare customPublishedAt: Date | null;

	@Column(DataType.TEXT)
	declare doi: string | null;

	// TODO: add validation for labels
	@Column(DataType.JSONB)
	declare labels:
		| {
				id: string;
				color: string;
				title: string;
				publicApply: boolean;
		  }[]
		| null;

	/**  TODO: add validation for downloads
	// Should be something like
 *   {
    "url": "https://assets.pubpub.org/44k2vnvm/61595701771772.pdf",
    "type": "formatted",
    "branchId": null,
    "createdAt": "2020-07-25T18:29:32.319Z"
  }
 */
	@Column(DataType.JSONB)
	declare downloads: any[] | null;

	@Column(DataType.JSONB)
	declare metadata: { mtg_id: string; bibcode: string; mtg_presentation_id: string } | null;

	@Column(DataType.STRING)
	declare viewHash: string | null;

	@Column(DataType.STRING)
	declare editHash: string | null;

	@Column(DataType.STRING)
	declare reviewHash: string | null;

	@Column(DataType.STRING)
	declare commentHash: string | null;

	@AllowNull(false)
	@Column(DataType.UUID)
	declare draftId: string;

	@Index({ using: 'BTREE' })
	@AllowNull(false)
	@Column(DataType.UUID)
	declare communityId: string;

	@Column(DataType.UUID)
	declare crossrefDepositRecordId: string | null;

	@Column(DataType.UUID)
	declare scopeSummaryId: string | null;

	@HasMany(() => PubAttribution, { onDelete: 'CASCADE', as: 'attributions', foreignKey: 'pubId' })
	declare attributions?: PubAttribution[];

	@HasMany(() => CollectionPub, {
		onDelete: 'CASCADE',
		hooks: true,
		as: 'collectionPubs',
		foreignKey: 'pubId',
	})
	declare collectionPubs?: CollectionPub[];

	@BelongsTo(() => Community, { onDelete: 'CASCADE', as: 'community', foreignKey: 'communityId' })
	declare community?: Community;

	@BelongsTo(() => Draft, { as: 'draft', foreignKey: 'draftId' })
	declare draft?: Draft;

	@HasMany(() => Discussion, { onDelete: 'CASCADE', as: 'discussions', foreignKey: 'pubId' })
	declare discussions?: Discussion[];

	@HasMany(() => Export, { as: 'exports', foreignKey: 'pubId' })
	declare exports?: Export[];

	@HasMany(() => ReviewNew, { onDelete: 'CASCADE', as: 'reviews', foreignKey: 'pubId' })
	declare reviews?: ReviewNew[];

	@HasMany(() => Member, { onDelete: 'CASCADE', as: 'members', foreignKey: 'pubId' })
	declare members?: Member[];

	@HasMany(() => Release, { onDelete: 'CASCADE', as: 'releases', foreignKey: 'pubId' })
	declare releases?: Release[];

	@HasMany(() => PubVersion, { onDelete: 'CASCADE', as: 'pubVersions', foreignKey: 'pubId' })
	declare pubVersions?: PubVersion[];

	@HasMany(() => PubEdge, { onDelete: 'CASCADE', as: 'outboundEdges', foreignKey: 'pubId' })
	declare outboundEdges?: Omit<PubEdge, 'pub'>[];

	@HasMany(() => PubEdge, { onDelete: 'CASCADE', as: 'inboundEdges', foreignKey: 'targetPubId' })
	declare inboundEdges?: Omit<PubEdge, 'targetPub'>[];

	@HasOne(() => Submission, { as: 'submission', foreignKey: 'pubId' })
	declare submission?: Submission;

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
}
