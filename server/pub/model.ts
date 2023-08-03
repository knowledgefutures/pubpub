/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-dupe-class-members */
/* eslint-disable lines-between-class-members */
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
import type {
	InferAttributes,
	InferCreationAttributes,
	CreationOptional,
	BuildOptions,
	Logging,
	Silent,
	Transactionable,
	Hookable,
	TruncateOptions,
	Paranoid,
} from 'sequelize';
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

// declare module 'sequelize' {
// 	export interface CreateOptions<TAttributes = any>
// 		extends BuildOptions,
// 			Logging,
// 			Silent,
// 			Transactionable,
// 			Hookable {
// 		actorId?: string | null;
// 	}

// 	export interface DestroyOptions<TAttributes = any> extends TruncateOptions<TAttributes> {
// 		actorId?: string | null;
// 	}

// 	export interface UpdateOptions<TAttributes = any>
// 		extends Logging,
// 			Transactionable,
// 			Paranoid,
// 			Hookable {
// 		actorId?: string | null;
// 	}
// }

@Table
class Pub extends Model<InferAttributes<Pub>, InferCreationAttributes<Pub>> {
	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	id!: CreationOptional<string>;

	@AllowNull(false)
	@IsLowercase
	@Length({ min: 1, max: 280 })
	@Is(/^[a-zA-Z0-9-]+$/)
	@Unique
	@Column(DataType.TEXT)
	slug!: string;

	@AllowNull(false)
	@Column(DataType.TEXT)
	title!: string;

	@Column(DataType.TEXT)
	htmlTitle!: string | null;

	@Length({ min: 0, max: 280 })
	@Column(DataType.TEXT)
	description!: string | null;

	@Length({ min: 0, max: 280 })
	@Column(DataType.TEXT)
	htmlDescription?: string | null;

	@Column(DataType.TEXT)
	avatar?: string | null;

	@Column(DataType.DATE)
	// 	customPublishedAt?: Date | null;
	customPublishedAt?: any;

	@Column(DataType.TEXT)
	doi?: string | null;

	// TODO: add validation for labels
	@Column(DataType.JSONB)
	labels?: string[] | null;

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
	downloads?: any[] | null;

	@Column(DataType.JSONB)
	metadata?: object | null;

	@Column(DataType.STRING)
	viewHash?: string | null;

	@Column(DataType.STRING)
	editHash?: string | null;

	@Column(DataType.STRING)
	reviewHash?: string | null;

	@Column(DataType.STRING)
	commentHash?: string | null;

	@AllowNull(false)
	@Column(DataType.UUID)
	draftId!: string;

	@Index({ using: 'BTREE' })
	@AllowNull(false)
	@Column(DataType.UUID)
	communityId!: string;

	@Column(DataType.UUID)
	crossrefDepositRecordId?: string | null;

	@Column(DataType.UUID)
	scopeSummaryId?: string | null;

	@HasMany(() => PubAttribution, { onDelete: 'CASCADE', as: 'attributions', foreignKey: 'pubId' })
	// 	attributions?: PubAttribution[];
	attributions?: any;

	@HasMany(() => CollectionPub, {
		onDelete: 'CASCADE',
		hooks: true,
		as: 'collectionPubs',
		foreignKey: 'pubId',
	})
	// 	collectionPubs?: CollectionPub[];
	collectionPubs?: any;

	@BelongsTo(() => Community, { onDelete: 'CASCADE', as: 'community', foreignKey: 'communityId' })
	// 	community?: Community;
	community?: any;

	@BelongsTo(() => Draft, { as: 'draft', foreignKey: 'draftId' })
	// 	draft?: Draft;
	draft?: any;

	@HasMany(() => Discussion, { onDelete: 'CASCADE', as: 'discussions', foreignKey: 'pubId' })
	// 	discussions?: Discussion[];
	discussions?: any;

	@HasMany(() => Export, { as: 'exports', foreignKey: 'pubId' })
	// 	exports?: Export[];
	exports?: any;

	@HasMany(() => ReviewNew, { onDelete: 'CASCADE', as: 'reviews', foreignKey: 'pubId' })
	// 	reviews?: ReviewNew[];
	reviews?: any;

	@HasMany(() => Member, { onDelete: 'CASCADE', as: 'members', foreignKey: 'pubId' })
	// 	members?: Member[];
	members?: any;

	@HasMany(() => Release, { onDelete: 'CASCADE', as: 'releases', foreignKey: 'pubId' })
	// 	releases?: Release[];
	releases?: any;

	@HasMany(() => PubVersion, { onDelete: 'CASCADE', as: 'pubVersions', foreignKey: 'pubId' })
	// 	pubVersions?: PubVersion[];
	pubVersions?: any;

	@HasMany(() => PubEdge, { onDelete: 'CASCADE', as: 'outboundEdges', foreignKey: 'pubId' })
	// 	outboundEdges?: Omit<PubEdge, 'pub'>[];
	outboundEdges?: any;

	@HasMany(() => PubEdge, { onDelete: 'CASCADE', as: 'inboundEdges', foreignKey: 'targetPubId' })
	// 	inboundEdges?: Omit<PubEdge, 'targetPub'>[];
	inboundEdges?: any;

	@HasOne(() => Submission, { as: 'submission', foreignKey: 'pubId' })
	// 	submission?: Submission;
	submission?: any;

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
}

export const PubAnyModel = Pub as any;
