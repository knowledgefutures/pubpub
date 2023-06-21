import { DataTypes as dataTypes } from 'sequelize';
import passportLocalSequelize from 'passport-local-sequelize';
import { sequelize } from '../sequelize';

const UserWithoutPassPort = sequelize.define(
	'User',
	{
		id: sequelize.idType,
		slug: {
			type: dataTypes.TEXT,
			unique: true,
			allowNull: false,
			validate: {
				isLowercase: true,
				len: [1, 280],
				is: /^[a-zA-Z0-9-]+$/, // Must contain at least one letter, alphanumeric and underscores and hyphens
			},
		},
		firstName: { type: dataTypes.TEXT, allowNull: false },
		lastName: { type: dataTypes.TEXT, allowNull: false },
		fullName: { type: dataTypes.TEXT, allowNull: false },
		initials: { type: dataTypes.STRING, allowNull: false },
		avatar: { type: dataTypes.TEXT },
		bio: { type: dataTypes.TEXT },
		title: { type: dataTypes.TEXT },
		email: {
			type: dataTypes.TEXT,
			allowNull: false,
			unique: true,
			validate: {
				isEmail: true,
				isLowercase: true,
			},
		},
		publicEmail: {
			type: dataTypes.TEXT,
			validate: {
				isEmail: true,
				isLowercase: true,
			},
		},
		authRedirectHost: { type: dataTypes.TEXT },
		location: { type: dataTypes.TEXT },
		website: { type: dataTypes.TEXT },
		facebook: { type: dataTypes.TEXT },
		twitter: { type: dataTypes.TEXT },
		github: { type: dataTypes.TEXT },
		orcid: { type: dataTypes.TEXT },
		googleScholar: { type: dataTypes.TEXT },
		resetHashExpiration: { type: dataTypes.DATE },
		resetHash: { type: dataTypes.TEXT },
		inactive: { type: dataTypes.BOOLEAN },
		pubpubV3Id: { type: dataTypes.INTEGER },
		passwordDigest: { type: dataTypes.TEXT },
		hash: { type: dataTypes.TEXT, allowNull: false },
		salt: { type: dataTypes.TEXT, allowNull: false },
		gdprConsent: { type: dataTypes.BOOLEAN, defaultValue: null },
		isSuperAdmin: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },
	},
	{
		// @ts-expect-error ts(2345): Argument of type '{ classMethods: { associate: (models: any) => void; }; }' is not assignable to parameter of type 'ModelOptions<Model<any, any>>'. Object literal may only specify known properties, and 'classMethods' does not exist in type 'ModelOptions<Model<any, any>>'.
		classMethods: {
			associate: (models) => {
				const {
					PubAttribution,
					Discussion,
					UserNotificationPreferences,
					zoteroIntegration,
				} = models;
				UserWithoutPassPort.hasMany(PubAttribution, {
					onDelete: 'CASCADE',
					as: 'attributions',
					foreignKey: 'userId',
				});
				UserWithoutPassPort.hasMany(Discussion, {
					onDelete: 'CASCADE',
					as: 'discussions',
					foreignKey: 'userId',
				});
				UserWithoutPassPort.hasOne(UserNotificationPreferences, {
					onDelete: 'CASCADE',
					as: 'userNotificationPreferences',
					foreignKey: 'userId',
				});
				UserWithoutPassPort.hasOne(zoteroIntegration, {
					foreignKey: { name: 'userId', allowNull: false },
				});
			},
		},
	},
) as any;
passportLocalSequelize.attachToUser(UserWithoutPassPort, {
	usernameField: 'email',
	hashField: 'hash',
	saltField: 'salt',
	digest: 'sha512',
	iterations: 25000,
});

export const User = UserWithoutPassPort;

export const attributesPublicUser = [
	'id',
	'firstName',
	'lastName',
	'fullName',
	'avatar',
	'slug',
	'initials',
	'title',
	'orcid',
];

export const includeUserModel = (() => {
	return (options) => {
		const { attributes: providedAttributes = [], ...restOptions } = options;
		const attributes = [...new Set([...attributesPublicUser, ...providedAttributes])];
		// eslint-disable-next-line pubpub-rules/no-user-model
		return {
			model: User,
			attributes,
			...restOptions,
		};
	};
})();
