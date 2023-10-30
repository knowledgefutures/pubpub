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
import { SerializedModel } from 'types';
import type {
	InferAttributes,
	InferCreationAttributes,
	CreationOptional,
	CreationAttributes,
	ModelStatic,
} from 'sequelize';
import type { Strategy } from 'passport';
import {
	PubAttribution,
	Discussion,
	UserNotificationPreferences,
	ZoteroIntegration,
} from '../models';

/**
 * Basically typings for passport-local-sequelize
 */
class ModelWithPassport<T extends {} = any, C extends {} = T> extends Model<T, C> {
	declare setPassword: <M extends Model>(
		this: M,
		password: string,
		cb: (err: any, user?: M) => void,
	) => void;

	declare setActivationKey: <M extends Model>(this: M, cb: (err: any, user?: M) => void) => void;

	declare authenticate: <M extends Model>(
		this: M,
		password: string,
		cb: ((err: any, user?: boolean, info?: any) => void) &
			((err: any, user?: M, info?: any) => void),
	) => void;

	declare static authenticate: <M extends Model>(
		this: ModelStatic<M>,
	) => (
		username: string,
		password: string,
		cb: ((err: any, user?: boolean, info?: any) => void) &
			((err: any, user?: M, info?: any) => void),
	) => void;

	declare static serializeUser: <M extends Model>(
		this: ModelStatic<M>,
	) => (user: M, cb: (err: any, id?: string) => void) => void;

	declare static deserializeUser: <M extends Model>(
		this: ModelStatic<M>,
	) => (username: string, cb: (err: any, user?: M) => void) => void;

	declare static register: <M extends Model>(
		this: ModelStatic<M>,
		user: M | string | CreationAttributes<ModelWithPassport>,
		password: string,
		cb: (err: any, user?: M) => void,
	) => void;

	declare static activate: <M extends Model>(
		this: ModelStatic<M>,
		username: string,
		password: string,
		activationKey: string,
		cb: (err: any, user?: M) => void,
	) => void;

	declare static findByUsername: <M extends Model>(
		this: ModelStatic<M>,

		username: string,
		cb: (err: any, user?: M) => void,
	) => void;

	declare static setResetPasswordKey: <M extends Model>(
		this: ModelStatic<M>,
		username: string,
		cb: (err: any, user?: M) => void,
	) => void;

	declare static resetPassword: <M extends Model>(
		this: ModelStatic<M>,
		username: string,
		password: string,
		resetPasswordKey: string,
		cb: (err: any, user?: M) => void,
	) => void;

	declare static createStrategy: () => Strategy;

	declare isShadowUser?: boolean;

	declare feedback?: string;

	declare sha3hashedPassword: CreationOptional<string>;
}

@Table
export class User extends ModelWithPassport<InferAttributes<User>, InferCreationAttributes<User>> {
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
	declare firstName: string;

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare lastName: string;

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare fullName: string;

	@AllowNull(false)
	@Column(DataType.STRING)
	declare initials: string;

	@Column(DataType.TEXT)
	declare avatar: string | null;

	@Column(DataType.TEXT)
	declare bio: string | null;

	@Column(DataType.TEXT)
	declare title: string | null;

	@AllowNull(false)
	@IsLowercase
	@IsEmail
	@Unique
	@Column(DataType.TEXT)
	declare email: string;

	@IsLowercase
	@IsEmail
	@Column(DataType.TEXT)
	declare publicEmail: string | null;

	@Column(DataType.TEXT)
	declare authRedirectHost: string | null;

	@Column(DataType.TEXT)
	declare location: string | null;

	@Column(DataType.TEXT)
	declare website: string | null;

	@Column(DataType.TEXT)
	declare facebook: string | null;

	@Column(DataType.TEXT)
	declare twitter: string | null;

	@Column(DataType.TEXT)
	declare github: string | null;

	@Column(DataType.TEXT)
	declare orcid: string | null;

	@Column(DataType.TEXT)
	declare googleScholar: string | null;

	@Column(DataType.DATE)
	declare resetHashExpiration: Date | null;

	@Column(DataType.TEXT)
	declare resetHash: string | null;

	@Column(DataType.BOOLEAN)
	declare inactive: boolean | null;

	@Column(DataType.INTEGER)
	declare pubpubV3Id: number | null;

	@Column(DataType.TEXT)
	declare passwordDigest: string | null;

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare hash: CreationOptional<string>;

	@AllowNull(false)
	@Column(DataType.TEXT)
	declare salt: CreationOptional<string>;

	@Default(null)
	@Column(DataType.BOOLEAN)
	declare gdprConsent: CreationOptional<boolean | null>;

	@AllowNull(false)
	@Default(false)
	@Column(DataType.BOOLEAN)
	declare isSuperAdmin: CreationOptional<boolean>;

	@HasMany(() => PubAttribution, {
		onDelete: 'CASCADE',
		as: 'attributions',
		foreignKey: 'userId',
	})
	declare attributions?: PubAttribution[];

	@HasMany(() => Discussion, { onDelete: 'CASCADE', as: 'discussions', foreignKey: 'userId' })
	declare discussions?: Discussion[];

	@HasOne(() => UserNotificationPreferences, {
		onDelete: 'CASCADE',
		as: 'userNotificationPreferences',
		foreignKey: 'userId',
	})
	declare userNotificationPreferences?: UserNotificationPreferences;

	@HasOne(() => ZoteroIntegration, {
		as: 'zoteroIntegration',
		foreignKey: { name: 'userId', allowNull: false },
	})
	declare zoteroIntegration?: ZoteroIntegration;
}
