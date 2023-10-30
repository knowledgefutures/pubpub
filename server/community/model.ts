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
	BelongsTo,
	HasMany,
} from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import type { SerializedModel } from 'types';
import { CommunityHeaderLink, CommunityHeroButton, CommunityNavigationEntry } from 'types';
import {
	Organization,
	Collection,
	Pub,
	Page,
	DepositTarget,
	ScopeSummary,
	SpamTag,
} from '../models';

@Table
export class Community extends Model<
	InferAttributes<Community>,
	InferCreationAttributes<Community>
> {
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
	declare subdomain: string;

	@Unique
	@Column(DataType.TEXT)
	declare domain: string | null;

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare title: string;

	@Column(DataType.TEXT)
	declare citeAs: string | null;

	@Column(DataType.TEXT)
	declare publishAs: string | null;

	@Length({ min: 0, max: 280 })
	@Column(DataType.TEXT)
	declare description: string | null;

	@Column(DataType.TEXT)
	declare avatar: string | null;

	@Column(DataType.TEXT)
	declare favicon: string | null;

	// TODO: Make this `AllowNull(false)`. Communities always have a color.
	@Column(DataType.STRING)
	declare accentColorLight: string;

	// TODO: Make this `AllowNull(false)`. Communities always have a color.
	@Column(DataType.STRING)
	declare accentColorDark: string;

	@Column(DataType.BOOLEAN)
	declare hideCreatePubButton: boolean | null;

	@Column(DataType.TEXT)
	declare headerLogo: string | null;

	// TODO: Add validation for headerLinks
	@Column(DataType.JSONB)
	declare headerLinks: CommunityHeaderLink[] | null;

	@Default('dark')
	@Column(DataType.ENUM('light', 'dark', 'custom'))
	declare headerColorType: CreationOptional<'light' | 'dark' | 'custom' | null>;

	@Column(DataType.BOOLEAN)
	declare useHeaderTextAccent: boolean | null;

	@Column(DataType.BOOLEAN)
	declare hideHero: boolean | null;

	@Column(DataType.BOOLEAN)
	declare hideHeaderLogo: boolean | null;

	@Column(DataType.TEXT)
	declare heroLogo: string | null;

	@Column(DataType.TEXT)
	declare heroBackgroundImage: string | null;

	@Column(DataType.TEXT)
	declare heroBackgroundColor: string | null;

	@Column(DataType.TEXT)
	declare heroTextColor: string | null;

	@Column(DataType.BOOLEAN)
	declare useHeaderGradient: boolean | null;

	@Column(DataType.TEXT)
	declare heroImage: string | null;

	@Column(DataType.TEXT)
	declare heroTitle: string | null;

	@Column(DataType.TEXT)
	declare heroText: string | null;

	// TODO: Add validation for heroPrimaryButton
	@Column(DataType.JSONB)
	declare heroPrimaryButton: CommunityHeroButton | null;

	// TODO: Add validation for heroSecondaryButton
	@Column(DataType.JSONB)
	declare heroSecondaryButton: CommunityHeroButton | null;

	@Column(DataType.TEXT)
	declare heroAlign: string | null;

	// TODO: Add validation for navigation
	@Column(DataType.JSONB)
	declare navigation: CommunityNavigationEntry[] | null;

	@Column(DataType.BOOLEAN)
	declare hideNav: boolean | null;

	// TODO: Add validation for navLinks
	@Column(DataType.JSONB)
	declare navLinks: CommunityNavigationEntry[] | null;

	// TODO: Add validation for footerLinks
	@Column(DataType.JSONB)
	declare footerLinks: CommunityNavigationEntry[] | null;

	@Column(DataType.TEXT)
	declare footerLogoLink: string | null;

	@Column(DataType.TEXT)
	declare footerTitle: string | null;

	@Column(DataType.TEXT)
	declare footerImage: string | null;

	@Column(DataType.TEXT)
	declare website: string | null;

	@Column(DataType.TEXT)
	declare facebook: string | null;

	@Column(DataType.TEXT)
	declare twitter: string | null;

	@Column(DataType.TEXT)
	declare email: string | null;

	@Column(DataType.TEXT)
	declare issn: string | null;

	@Column(DataType.BOOLEAN)
	declare isFeatured: boolean | null;

	@Column(DataType.STRING)
	declare viewHash: string | null;

	@Column(DataType.STRING)
	declare editHash: string | null;

	@Default(false)
	@Column(DataType.BOOLEAN)
	declare premiumLicenseFlag: CreationOptional<boolean | null>;

	// TODO: Add validation for defaultPubCollections
	@Column(DataType.JSONB)
	declare defaultPubCollections: string[] | null;

	@Column(DataType.UUID)
	declare spamTagId: string | null;

	@Column(DataType.UUID)
	declare organizationId: string | null;

	@Column(DataType.UUID)
	declare scopeSummaryId: string | null;

	@BelongsTo(() => Organization, {
		onDelete: 'CASCADE',
		as: 'organization',
		foreignKey: 'organizationId',
	})
	declare organization?: Organization;

	@HasMany(() => Collection, {
		onDelete: 'CASCADE',
		as: 'collections',
		foreignKey: 'communityId',
	})
	declare collections?: Collection[];

	@HasMany(() => Pub, { onDelete: 'CASCADE', as: 'pubs', foreignKey: 'communityId' })
	declare pubs?: Pub[];

	@HasMany(() => Page, { onDelete: 'CASCADE', as: 'pages', foreignKey: 'communityId' })
	declare pages?: Page[];

	@HasMany(() => DepositTarget, {
		onDelete: 'CASCADE',
		as: 'depositTargets',
		foreignKey: 'communityId',
	})
	declare depositTargets?: DepositTarget[];

	@BelongsTo(() => ScopeSummary, {
		as: 'scopeSummary',
		foreignKey: 'scopeSummaryId',
		onDelete: 'SET NULL',
	})
	declare scopeSummary?: ScopeSummary;

	@BelongsTo(() => SpamTag, { as: 'spamTag', foreignKey: 'spamTagId' })
	declare spamTag?: SpamTag;

	declare accentTextColor: CreationOptional<string>;
}
