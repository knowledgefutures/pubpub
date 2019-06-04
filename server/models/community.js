export default (sequelize) => {
	const Sequelize = sequelize.Sequelize;

	return sequelize.define(
		'Community',
		{
			id: sequelize.idType,
			subdomain: {
				type: Sequelize.TEXT,
				unique: true,
				allowNull: false,
				validate: {
					isLowercase: true,
					len: [1, 280],
					is: /^[a-zA-Z0-9-]+$/, // Must contain at least one letter, alphanumeric and hyphens
				},
			},
			domain: {
				type: Sequelize.TEXT,
				unique: true,
			},
			title: { type: Sequelize.TEXT, allowNull: false },
			description: {
				type: Sequelize.TEXT,
				validate: {
					len: [0, 280],
				},
			},
			avatar: { type: Sequelize.TEXT },
			favicon: { type: Sequelize.TEXT },
			accentColorLight: { type: Sequelize.STRING },
			accentColorDark: { type: Sequelize.STRING },
			hideCreatePubButton: { type: Sequelize.BOOLEAN },
			headerLogo: { type: Sequelize.TEXT },
			headerLinks: { type: Sequelize.JSONB },
			headerColorType: {
				type: Sequelize.ENUM,
				values: ['light', 'dark', 'custom'],
				defaultValue: 'light',
			},
			useHeaderTextAccent: { type: Sequelize.BOOLEAN },
			hideHero: { type: Sequelize.BOOLEAN },
			hideHeaderLogo: { type: Sequelize.BOOLEAN },
			heroLogo: { type: Sequelize.TEXT },
			heroBackgroundImage: { type: Sequelize.TEXT },
			heroBackgroundColor: { type: Sequelize.TEXT },
			heroTextColor: { type: Sequelize.TEXT },
			useHeaderGradient: { type: Sequelize.BOOLEAN },
			heroImage: { type: Sequelize.TEXT },
			heroTitle: { type: Sequelize.TEXT },
			heroText: { type: Sequelize.TEXT },
			heroPrimaryButton: { type: Sequelize.JSONB },
			heroSecondaryButton: { type: Sequelize.JSONB },
			heroAlign: { type: Sequelize.TEXT },

			/* Deprecated */
			accentColor: { type: Sequelize.STRING },
			accentTextColor: { type: Sequelize.STRING },
			accentActionColor: { type: Sequelize.STRING },
			accentHoverColor: { type: Sequelize.STRING },
			accentMinimalColor: { type: Sequelize.STRING },
			/* ---------- */

			navigation: { type: Sequelize.JSONB },
			hideNav: { type: Sequelize.BOOLEAN },
			website: { type: Sequelize.TEXT },
			facebook: { type: Sequelize.TEXT },
			twitter: { type: Sequelize.TEXT },
			email: { type: Sequelize.TEXT },
			issn: { type: Sequelize.TEXT },
			isFeatured: { type: Sequelize.BOOLEAN },
			defaultPubCollections: { type: Sequelize.JSONB },
		},
		{
			classMethods: {
				associate: (models) => {
					const { Community, User, Collection, Discussion, Page, Pub } = models;
					Community.belongsToMany(User, {
						as: 'admins',
						through: 'CommunityAdmin',
						foreignKey: 'communityId',
					});
					Community.hasMany(Collection, {
						onDelete: 'CASCADE',
						as: 'collections',
						foreignKey: 'communityId',
					});
					Community.hasMany(Pub, {
						onDelete: 'CASCADE',
						as: 'pubs',
						foreignKey: 'communityId',
					});
					Community.hasMany(Discussion, {
						onDelete: 'CASCADE',
						as: 'discussions',
						foreignKey: 'communityId',
					});
					Community.hasMany(Page, {
						onDelete: 'CASCADE',
						as: 'pages',
						foreignKey: 'communityId',
					});
				},
			},
		},
	);
};
