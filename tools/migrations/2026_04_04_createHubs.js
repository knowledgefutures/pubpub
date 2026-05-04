export const up = async ({ Sequelize, sequelize }) => {
	// Create Hubs table
	await sequelize.queryInterface.createTable('Hubs', {
		id: {
			type: Sequelize.UUID,
			defaultValue: Sequelize.UUIDV4,
			primaryKey: true,
		},
		slug: {
			type: Sequelize.TEXT,
			allowNull: false,
			unique: true,
		},
		title: {
			type: Sequelize.TEXT,
			allowNull: false,
		},
		subtitle: {
			type: Sequelize.TEXT,
			allowNull: true,
		},
		description: {
			type: Sequelize.TEXT,
			allowNull: true,
		},
		avatar: {
			type: Sequelize.TEXT,
			allowNull: true,
		},
		heroImage: {
			type: Sequelize.TEXT,
			allowNull: true,
		},
		heroLogo: {
			type: Sequelize.TEXT,
			allowNull: true,
		},
		accentColorLight: {
			type: Sequelize.STRING,
			allowNull: true,
		},
		accentColorDark: {
			type: Sequelize.STRING,
			allowNull: true,
		},
		website: {
			type: Sequelize.TEXT,
			allowNull: true,
		},
		email: {
			type: Sequelize.TEXT,
			allowNull: true,
		},
		communityCreationEnabled: {
			type: Sequelize.BOOLEAN,
			defaultValue: true,
			allowNull: false,
		},
		createdAt: {
			type: Sequelize.DATE,
			allowNull: false,
		},
		updatedAt: {
			type: Sequelize.DATE,
			allowNull: false,
		},
	});

	// Create HubCommunities join table
	await sequelize.queryInterface.createTable('HubCommunities', {
		id: {
			type: Sequelize.UUID,
			defaultValue: Sequelize.UUIDV4,
			primaryKey: true,
		},
		hubId: {
			type: Sequelize.UUID,
			allowNull: false,
			references: {
				model: 'Hubs',
				key: 'id',
			},
			onDelete: 'CASCADE',
		},
		communityId: {
			type: Sequelize.UUID,
			allowNull: false,
			references: {
				model: 'Communities',
				key: 'id',
			},
			onDelete: 'CASCADE',
		},
		createdAt: {
			type: Sequelize.DATE,
			allowNull: false,
		},
		updatedAt: {
			type: Sequelize.DATE,
			allowNull: false,
		},
	});

	// Add unique constraint on (hubId, communityId)
	await sequelize.queryInterface.addConstraint('HubCommunities', {
		fields: ['hubId', 'communityId'],
		type: 'unique',
		name: 'HubCommunities_hubId_communityId_unique',
	});
};

export const down = async ({ sequelize }) => {
	await sequelize.queryInterface.dropTable('HubCommunities');
	await sequelize.queryInterface.dropTable('Hubs');
};
