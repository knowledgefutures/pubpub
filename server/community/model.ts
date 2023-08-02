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
import { CommunityHeaderLink, CommunityHeroButton } from 'types';
import { CommunityNavigationEntry } from 'client/utils/navigation';
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
	id!: CreationOptional<string>;

	@AllowNull(false)
	@IsLowercase
	@Length({ min: 1, max: 280 })
	@Is(/^[a-zA-Z0-9-]+$/)
	@Unique
	@Column(DataType.TEXT)
	subdomain!: string;

	@Unique
	@Column(DataType.TEXT)
	domain!: string | null;

	@AllowNull(false)
	@Column(DataType.TEXT)
	title!: string;

	@Column(DataType.TEXT)
	citeAs!: string | null;

	@Column(DataType.TEXT)
	publishAs!: string | null;

	@Length({ min: 0, max: 280 })
	@Column(DataType.TEXT)
	description!: string | null;

	@Column(DataType.TEXT)
	avatar!: string | null;

	@Column(DataType.TEXT)
	favicon!: string | null;

	// TODO: Make this `AllowNull(false)`. Communities always have a color.
	@Column(DataType.STRING)
	accentColorLight!: string;

	// TODO: Make this `AllowNull(false)`. Communities always have a color.
	@Column(DataType.STRING)
	accentColorDark!: string;

	@Column(DataType.BOOLEAN)
	hideCreatePubButton!: boolean | null;

	@Column(DataType.TEXT)
	headerLogo!: string | null;

	// TODO: Add validation for headerLinks
	@Column(DataType.JSONB)
	headerLinks!: CommunityHeaderLink[] | null;

	@Default('dark')
	@Column(DataType.ENUM('light', 'dark', 'custom'))
	headerColorType!: CreationOptional<'light' | 'dark' | 'custom' | null>;

	@Column(DataType.BOOLEAN)
	useHeaderTextAccent!: boolean | null;

	@Column(DataType.BOOLEAN)
	hideHero!: boolean | null;

	@Column(DataType.BOOLEAN)
	hideHeaderLogo!: boolean | null;

	@Column(DataType.TEXT)
	heroLogo!: string | null;

	@Column(DataType.TEXT)
	heroBackgroundImage!: string | null;

	@Column(DataType.TEXT)
	heroBackgroundColor!: string | null;

	@Column(DataType.TEXT)
	heroTextColor!: string | null;

	@Column(DataType.BOOLEAN)
	useHeaderGradient!: boolean | null;

	@Column(DataType.TEXT)
	heroImage!: string | null;

	@Column(DataType.TEXT)
	heroTitle!: string | null;

	@Column(DataType.TEXT)
	heroText!: string | null;

	// TODO: Add validation for heroPrimaryButton
	@Column(DataType.JSONB)
	heroPrimaryButton!: CommunityHeroButton | null;

	// TODO: Add validation for heroSecondaryButton
	@Column(DataType.JSONB)
	heroSecondaryButton!: CommunityHeroButton | null;

	@Column(DataType.TEXT)
	heroAlign!: string | null;

	// TODO: Add validation for navigation
	@Column(DataType.JSONB)
	navigation!: CommunityNavigationEntry[] | null;

	@Column(DataType.BOOLEAN)
	hideNav!: boolean | null;

	// TODO: Add validation for navLinks
	@Column(DataType.JSONB)
	navLinks!: CommunityNavigationEntry[] | null;

	// TODO: Add validation for footerLinks
	@Column(DataType.JSONB)
	footerLinks!: CommunityNavigationEntry[] | null;

	@Column(DataType.TEXT)
	footerLogoLink!: string | null;

	@Column(DataType.TEXT)
	footerTitle!: string | null;

	@Column(DataType.TEXT)
	footerImage!: string | null;

	@Column(DataType.TEXT)
	website!: string | null;

	@Column(DataType.TEXT)
	facebook!: string | null;

	@Column(DataType.TEXT)
	twitter!: string | null;

	@Column(DataType.TEXT)
	email!: string | null;

	@Column(DataType.TEXT)
	issn!: string | null;

	@Column(DataType.BOOLEAN)
	isFeatured!: boolean | null;

	@Column(DataType.STRING)
	viewHash!: string | null;

	@Column(DataType.STRING)
	editHash!: string | null;

	@Default(false)
	@Column(DataType.BOOLEAN)
	premiumLicenseFlag!: CreationOptional<boolean | null>;

	// TODO: Add validation for defaultPubCollections
	@Column(DataType.JSONB)
	defaultPubCollections!: string[] | null;

	@Column(DataType.UUID)
	spamTagId!: string | null;

	@Column(DataType.UUID)
	organizationId!: string | null;

	@Column(DataType.UUID)
	scopeSummaryId!: string | null;

	@BelongsTo(() => Organization, {
		onDelete: 'CASCADE',
		as: 'organization',
		foreignKey: 'organizationId',
	})
	organization?: Organization;

	@HasMany(() => Collection, {
		onDelete: 'CASCADE',
		as: 'collections',
		foreignKey: 'communityId',
	})
	collections?: Collection[];

	@HasMany(() => Pub, { onDelete: 'CASCADE', as: 'pubs', foreignKey: 'communityId' })
	pubs?: Pub[];

	@HasMany(() => Page, { onDelete: 'CASCADE', as: 'pages', foreignKey: 'communityId' })
	pages?: Page[];

	@HasMany(() => DepositTarget, {
		onDelete: 'CASCADE',
		as: 'depositTargets',
		foreignKey: 'communityId',
	})
	depositTargets?: DepositTarget[];

	@BelongsTo(() => ScopeSummary, {
		as: 'scopeSummary',
		foreignKey: 'scopeSummaryId',
		onDelete: 'SET NULL',
	})
	scopeSummary?: ScopeSummary;

	@BelongsTo(() => SpamTag, { as: 'spamTag', foreignKey: 'spamTagId' })
	spamTag?: SpamTag;

	declare accentTextColor: CreationOptional<string>;
}
