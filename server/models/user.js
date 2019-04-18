const passportLocalSequelize = require('passport-local-sequelize');

export default (sequelize) => {
	const Sequelize = sequelize.Sequelize;

	const User = sequelize.define(
		'User',
		{
			id: sequelize.idType,
			slug: {
				type: Sequelize.TEXT,
				unique: true,
				allowNull: false,
				validate: {
					isLowercase: true,
					len: [1, 280],
					is: /^[a-zA-Z0-9-]+$/, // Must contain at least one letter, alphanumeric and underscores and hyphens
				},
			},
			firstName: { type: Sequelize.TEXT, allowNull: false },
			lastName: { type: Sequelize.TEXT, allowNull: false },
			fullName: { type: Sequelize.TEXT, allowNull: false },
			initials: { type: Sequelize.STRING, allowNull: false },
			avatar: { type: Sequelize.TEXT },
			bio: { type: Sequelize.TEXT },
			title: { type: Sequelize.TEXT },
			email: {
				type: Sequelize.TEXT,
				allowNull: false,
				unique: true,
				validate: {
					isEmail: true,
					isLowercase: true,
				},
			},
			publicEmail: {
				type: Sequelize.TEXT,
				validate: {
					isEmail: true,
					isLowercase: true,
				},
			},
			location: { type: Sequelize.TEXT },
			website: { type: Sequelize.TEXT },
			facebook: { type: Sequelize.TEXT },
			twitter: { type: Sequelize.TEXT },
			github: { type: Sequelize.TEXT },
			orcid: { type: Sequelize.TEXT },
			googleScholar: { type: Sequelize.TEXT },
			resetHashExpiration: { type: Sequelize.DATE },
			resetHash: { type: Sequelize.TEXT },
			inactive: { type: Sequelize.BOOLEAN },
			pubpubV3Id: { type: Sequelize.INTEGER },
			passwordDigest: { type: Sequelize.TEXT },
			hash: { type: Sequelize.TEXT, allowNull: false },
			salt: { type: Sequelize.TEXT, allowNull: false },
		},
		{
			classMethods: {
				associate: (models) => {
					const { Community, PubAttribution, Discussion } = models;
					User.belongsToMany(Community, {
						as: 'communities',
						through: 'CommunityAdmin',
						foreignKey: 'userId',
					});
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
