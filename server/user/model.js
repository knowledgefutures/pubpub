const passportLocalSequelize = require('passport-local-sequelize');

export default (sequelize, dataTypes) => {
	const User = sequelize.define(
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
		},
		{
			classMethods: {
				associate: (models) => {
					const { PubAttribution, Discussion } = models;
					User.hasMany(PubAttribution, {
						onDelete: 'CASCADE',
						as: 'attributions',
						foreignKey: 'userId',
					});
					User.hasMany(Discussion, {
						onDelete: 'CASCADE',
						as: 'discussions',
						foreignKey: 'userId',
					});
				},
			},
		},
	);

	passportLocalSequelize.attachToUser(User, {
		usernameField: 'email',
		hashField: 'hash',
		saltField: 'salt',
		digest: 'sha512',
		iterations: 25000,
	});

	return User;
};
