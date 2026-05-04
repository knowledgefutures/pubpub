export const up = async ({ Sequelize, sequelize }) => {
	// Add pubSearchTerms column to Hubs
	await sequelize.queryInterface.addColumn('Hubs', 'pubSearchTerms', {
		type: Sequelize.JSONB,
		defaultValue: [],
		allowNull: false,
	});

	// Create HubPubs join table
	await sequelize.queryInterface.createTable('HubPubs', {
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
		pubId: {
			type: Sequelize.UUID,
			allowNull: false,
			references: {
				model: 'Pubs',
				key: 'id',
			},
			onDelete: 'CASCADE',
		},
		rank: {
			type: Sequelize.TEXT,
			allowNull: true,
		},
		showOnLandingPage: {
			type: Sequelize.BOOLEAN,
			defaultValue: true,
			allowNull: false,
		},
		dataAccess: {
			type: Sequelize.ENUM('none', 'requested', 'granted'),
			defaultValue: 'none',
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

	// Add unique constraint
	await sequelize.queryInterface.addConstraint('HubPubs', {
		fields: ['hubId', 'pubId'],
		type: 'unique',
		name: 'HubPubs_hubId_pubId_unique',
	});
};

export const down = async ({ sequelize }) => {
	await sequelize.queryInterface.dropTable('HubPubs');
	await sequelize.queryInterface.removeColumn('Hubs', 'pubSearchTerms');
};
