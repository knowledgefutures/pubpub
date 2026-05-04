import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';

import type {
	SerializedModel,
	TemplateCollectionDefinition,
	TemplateCommunityOverrides,
	TemplateDefaultMember,
	TemplateFacetOverrides,
	TemplateNavigationEntry,
	TemplatePageDefinition,
	TemplateStarterPubDefinition,
} from 'types';

import {
	AllowNull,
	BelongsTo,
	Column,
	DataType,
	Default,
	ForeignKey,
	IsLowercase,
	Length,
	Model,
	PrimaryKey,
	Table,
	Unique,
} from 'sequelize-typescript';

import { Hub } from '../hub/model';
import { User } from '../user/model';

@Table
export class CommunityTemplate extends Model<
	InferAttributes<CommunityTemplate>,
	InferCreationAttributes<CommunityTemplate>
> {
	@Default(DataType.UUIDV4)
	@PrimaryKey
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@Unique
	@IsLowercase
	@Length({ min: 1, max: 280 })
	@Column(DataType.TEXT)
	declare slug: string;

	@Column(DataType.TEXT)
	declare title: string;

	@AllowNull
	@Length({ max: 280 })
	@Column(DataType.TEXT)
	declare description: CreationOptional<string | null>;

	@AllowNull
	@Column(DataType.TEXT)
	declare avatar: CreationOptional<string | null>;

	/** Only active templates are shown to users during community creation */
	@Default(false)
	@Column(DataType.BOOLEAN)
	declare isActive: CreationOptional<boolean>;

	/** Partial community settings applied on top of the defaults */
	@Default({})
	@Column(DataType.JSONB)
	declare communityOverrides: CreationOptional<TemplateCommunityOverrides>;

	/** Page blueprints — first entry with slug '' replaces the default home page */
	@Default([])
	@Column(DataType.JSONB)
	declare pages: CreationOptional<TemplatePageDefinition[]>;

	/** Collection blueprints */
	@Default([])
	@Column(DataType.JSONB)
	declare collections: CreationOptional<TemplateCollectionDefinition[]>;

	/** Navigation structure (references pages/collections by slug, resolved at creation) */
	@AllowNull
	@Column(DataType.JSONB)
	declare navigation: CreationOptional<TemplateNavigationEntry[] | null>;

	/** Footer links */
	@AllowNull
	@Column(DataType.JSONB)
	declare footerLinks: CreationOptional<any[] | null>;

	/** Users to auto-add as members of the new community */
	@Default([])
	@Column(DataType.JSONB)
	declare defaultMembers: CreationOptional<TemplateDefaultMember[]>;

	/** Facet overrides (license, citation style, etc.) */
	@Default({})
	@Column(DataType.JSONB)
	declare facetOverrides: CreationOptional<TemplateFacetOverrides>;

	/** Starter pub blueprints */
	@Default([])
	@Column(DataType.JSONB)
	declare starterPubs: CreationOptional<TemplateStarterPubDefinition[]>;

	/** Custom CSS to inject via CustomScript when creating a community */
	@AllowNull
	@Column(DataType.TEXT)
	declare customCSS: CreationOptional<string | null>;

	/** UUID of the community this template was cloned from, if any */
	@AllowNull
	@Column(DataType.UUID)
	declare sourceCommunityId: CreationOptional<string | null>;

	@AllowNull
	@ForeignKey(() => User)
	@Column(DataType.UUID)
	declare createdById: CreationOptional<string | null>;

	@BelongsTo(() => User, { foreignKey: 'createdById' })
	declare createdBy?: User;

	/** Optional hub that owns this template (hub managers can edit their own) */
	@AllowNull
	@ForeignKey(() => Hub)
	@Column(DataType.UUID)
	declare hubId: CreationOptional<string | null>;

	@BelongsTo(() => Hub, { foreignKey: 'hubId', onDelete: 'SET NULL' })
	declare hub?: Hub;

	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;

	toJSON(): SerializedModel<CommunityTemplate> {
		return super.toJSON() as unknown as SerializedModel<CommunityTemplate>;
	}
}
