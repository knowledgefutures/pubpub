import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';

import type { SerializedModel } from 'types';

import {
	AllowNull,
	BelongsToMany,
	Column,
	DataType,
	Default,
	IsLowercase,
	Length,
	Model,
	PrimaryKey,
	Table,
	Unique,
} from 'sequelize-typescript';

@Table
export class Hub extends Model<InferAttributes<Hub>, InferCreationAttributes<Hub>> {
	// PK
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
	@Column(DataType.TEXT)
	declare subtitle: CreationOptional<string | null>;

	@AllowNull
	@Length({ max: 280 })
	@Column(DataType.TEXT)
	declare description: CreationOptional<string | null>;

	@AllowNull
	@Column(DataType.TEXT)
	declare avatar: CreationOptional<string | null>;

	@AllowNull
	@Column(DataType.TEXT)
	declare heroImage: CreationOptional<string | null>;

	@AllowNull
	@Column(DataType.TEXT)
	declare heroLogo: CreationOptional<string | null>;

	@AllowNull
	@Column(DataType.STRING)
	declare accentColorLight: CreationOptional<string | null>;

	@AllowNull
	@Column(DataType.STRING)
	declare accentColorDark: CreationOptional<string | null>;

	@AllowNull
	@Column(DataType.TEXT)
	declare website: CreationOptional<string | null>;

	@AllowNull
	@Column(DataType.TEXT)
	declare email: CreationOptional<string | null>;

	/** When true, the org landing page shows a "Create Community" button */
	@Default(true)
	@Column(DataType.BOOLEAN)
	declare communityCreationEnabled: CreationOptional<boolean>;

	/** When true, the community create page shows a "Clone from Community" option */
	@Default('off')
	@Column(DataType.ENUM('off', 'everyone', 'managers'))
	declare communityCloneAccess: CreationOptional<'off' | 'everyone' | 'managers'>;

	/** When true, the public /hub/:slug page and /hub/:slug/dashboard are visible.
	 *  When false, only superadmins can see the dashboard. */
	@Default(false)
	@Column(DataType.BOOLEAN)
	declare isActive: CreationOptional<boolean>;

	/** When true, the org is hidden from the /hubs directory listing.
	 *  Only superadmins and hub managers can view private orgs. */
	@Default(false)
	@Column(DataType.BOOLEAN)
	declare isPrivate: CreationOptional<boolean>;

	/** Email TLD patterns (e.g. ["mit.edu", "ox.ac.uk"]) used to discover suggested communities. */
	@Default([])
	@Column(DataType.JSONB)
	declare domains: CreationOptional<string[]>;

	/** Phrases used to discover suggested pubs via full-text search (superadmin-only). */
	@Default([])
	@Column(DataType.JSONB)
	declare pubSearchTerms: CreationOptional<string[]>;

	// Timestamps
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;

	toJSON(): SerializedModel<Hub> {
		return super.toJSON() as unknown as SerializedModel<Hub>;
	}
}
