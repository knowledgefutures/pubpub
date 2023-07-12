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
	IsEmail,
	HasMany,
	HasOne,
} from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import {
	PubAttribution,
	Discussion,
	UserNotificationPreferences,
	ZoteroIntegration,
} from '../models';

@Table
class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
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
	firstName!: string;

	@AllowNull(false)
	@Column(DataType.TEXT)
	lastName!: string;

	@AllowNull(false)
	@Column(DataType.TEXT)
	fullName!: string;

	@AllowNull(false)
	@Column(DataType.STRING)
	initials!: string;

	@Column(DataType.TEXT)
	avatar?: string | null;

	@Column(DataType.TEXT)
	bio?: string | null;

	@Column(DataType.TEXT)
	title?: string | null;

	@AllowNull(false)
	@IsLowercase
	@IsEmail
	@Unique
	@Column(DataType.TEXT)
	email!: string;

	@IsLowercase
	@IsEmail
	@Column(DataType.TEXT)
	publicEmail?: string | null;

	@Column(DataType.TEXT)
	authRedirectHost?: string | null;

	@Column(DataType.TEXT)
	location?: string | null;

	@Column(DataType.TEXT)
	website?: string | null;

	@Column(DataType.TEXT)
	facebook?: string | null;

	@Column(DataType.TEXT)
	twitter?: string | null;

	@Column(DataType.TEXT)
	github?: string | null;

	@Column(DataType.TEXT)
	orcid?: string | null;

	@Column(DataType.TEXT)
	googleScholar?: string | null;

	@Column(DataType.DATE)
	// 	resetHashExpiration?: Date | null;
	resetHashExpiration?: any;

	@Column(DataType.TEXT)
	resetHash?: string | null;

	@Column(DataType.BOOLEAN)
	inactive?: boolean | null;

	@Column(DataType.INTEGER)
	pubpubV3Id?: number | null;

	@Column(DataType.TEXT)
	passwordDigest?: string | null;

	@AllowNull(false)
	@Column(DataType.TEXT)
	hash!: string;

	@AllowNull(false)
	@Column(DataType.TEXT)
	salt!: string;

	@Default(null)
	@Column(DataType.BOOLEAN)
	// 	gdprConsent?: CreationOptional<boolean | null>;
	gdprConsent?: any;

	@AllowNull(false)
	@Default(false)
	@Column(DataType.BOOLEAN)
	isSuperAdmin!: CreationOptional<boolean>;

	declare isShadowUser?: boolean;

	declare feedback?: string;

	declare sha3hashedPassword: CreationOptional<string>;

	@HasMany(() => PubAttribution, {
		onDelete: 'CASCADE',
		as: 'attributions',
		foreignKey: 'userId',
	})
	// 	attributions?: PubAttribution[];
	attributions?: any;

	@HasMany(() => Discussion, { onDelete: 'CASCADE', as: 'discussions', foreignKey: 'userId' })
	// 	discussions?: Discussion[];
	discussions?: any;

	@HasOne(() => UserNotificationPreferences, {
		onDelete: 'CASCADE',
		as: 'userNotificationPreferences',
		foreignKey: 'userId',
	})
	// 	userNotificationPreferences?: UserNotificationPreferences;
	userNotificationPreferences?: any;

	@HasOne(() => ZoteroIntegration, {
		as: 'zoteroIntegration',
		foreignKey: { name: 'userId', allowNull: false },
	})
	// 	zoteroIntegration?: ZoteroIntegration;
	zoteroIntegration?: any;

	declare setPassword: (password: string, cb: (err: any, user?: any) => void) => void;

	declare setActivationKey: (cb: (err: any, user?: any) => void) => void;

	declare authenticate: (
		password: string,
		cb: (err: any, user?: any, info?: any) => void,
	) => void;

	// @ts-expect-error
	// eslint-disable-next-line no-dupe-class-members
	declare authenticate: () => (
		username: string,
		password: string,
		cb: (err: any, user?: any, info?: any) => void,
	) => void;

	declare serializeUser: () => (user: User, cb: (err: any, id?: any) => void) => User[];

	declare deserializeUser: () => (username: string, cb: (err: any, user?: any) => void) => User;

	declare register: (user: User, password: string, cb: (err: any, user?: any) => void) => User;

	declare activate: (
		username: string,
		password: string,
		activationKey: string,
		cb: (err: any, user?: any) => void,
	) => void;

	declare findByUsername: (username: string, cb: (err: any, user?: any) => void) => void;

	declare setResetPasswordKey: (username: string, cb: (err: any, user?: any) => void) => void;

	declare resetPassword: (
		username: string,
		password: string,
		resetPasswordKey: string,
		cb: (err: any, user?: any) => void,
	) => void;

	declare createStrategy: () => any;
}

export const UserAnyModel = User as any;
