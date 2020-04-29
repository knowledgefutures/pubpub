export default (sequelize, dataTypes) => {
	return sequelize.define(
		'Community',
		{
			id: sequelize.idType,
			subdomain: {
				type: dataTypes.TEXT,
				unique: true,
				allowNull: false,
				validate: {
					isLowercase: true,
					len: [1, 280],
					is: /^[a-zA-Z0-9-]+$/, // Must contain at least one letter, alphanumeric and hyphens
				},
			},
			domain: {
				type: dataTypes.TEXT,
				unique: true,
			},
			title: { type: dataTypes.TEXT, allowNull: false },
			description: {
				type: dataTypes.TEXT,
				validate: {
					len: [0, 280],
				},
			},
			avatar: { type: dataTypes.TEXT },
			favicon: { type: dataTypes.TEXT },
			accentColorLight: { type: dataTypes.STRING },
			accentColorDark: { type: dataTypes.STRING },
			hideCreatePubButton: { type: dataTypes.BOOLEAN },
			headerLogo: { type: dataTypes.TEXT },
			headerLinks: { type: dataTypes.JSONB },
			headerColorType: {
				type: dataTypes.ENUM,
				values: ['light', 'dark', 'custom'],
				defaultValue: 'dark',
			},
			useHeaderTextAccent: { type: dataTypes.BOOLEAN },
			hideHero: { type: dataTypes.BOOLEAN },
			hideHeaderLogo: { type: dataTypes.BOOLEAN },
			heroLogo: { type: dataTypes.TEXT },
			heroBackgroundImage: { type: dataTypes.TEXT },
			heroBackgroundColor: { type: dataTypes.TEXT },
			heroTextColor: { type: dataTypes.TEXT },
			useHeaderGradient: { type: dataTypes.BOOLEAN },
			heroImage: { type: dataTypes.TEXT },
			heroTitle: { type: dataTypes.TEXT },
			heroText: { type: dataTypes.TEXT },
			heroPrimaryButton: { type: dataTypes.JSONB },
			heroSecondaryButton: { type: dataTypes.JSONB },
			heroAlign: { type: dataTypes.TEXT },
			navigation: { type: dataTypes.JSONB },
			hideNav: { type: dataTypes.BOOLEAN },

			navLinks: { type: dataTypes.JSONB },
			footerLinks: { type: dataTypes.JSONB },
			footerTitle: { type: dataTypes.TEXT },
			footerImage: { type: dataTypes.TEXT },

			website: { type: dataTypes.TEXT },
			facebook: { type: dataTypes.TEXT },
			twitter: { type: dataTypes.TEXT },
			email: { type: dataTypes.TEXT },
			issn: { type: dataTypes.TEXT },
			isFeatured: { type: dataTypes.BOOLEAN },
			viewHash: { type: dataTypes.STRING },
			editHash: { type: dataTypes.STRING },
			premiumLicenseFlag: { type: dataTypes.BOOLEAN, defaultValue: false },
			defaultPubCollections: { type: dataTypes.JSONB },

			/* Set by Associations */
			organizationId: { type: dataTypes.UUID },
		},
		{
			classMethods: {
				associate: (models) => {
					const { Community, Organization, Collection, Discussion, Page, Pub } = models;
					Community.belongsTo(Organization, {
						onDelete: 'CASCADE',
						as: 'organization',
						foreignKey: 'organizationId',
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
