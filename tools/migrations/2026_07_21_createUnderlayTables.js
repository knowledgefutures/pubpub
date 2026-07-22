module.exports = async ({ Sequelize, sequelize }) => {
	await sequelize.queryInterface.createTable('UnderlayIntegrations', {
		id: {
			type: Sequelize.UUID,
			primaryKey: true,
			defaultValue: Sequelize.UUIDV4,
			allowNull: false,
		},
		communityId: {
			type: Sequelize.UUID,
			allowNull: true,
			references: { model: 'Communities', key: 'id' },
			onDelete: 'CASCADE',
		},
		underlayOrg: {
			type: Sequelize.STRING,
			allowNull: true,
		},
		underlayCollection: {
			type: Sequelize.STRING,
			allowNull: true,
		},
		apiKey: {
			type: Sequelize.TEXT,
			allowNull: true,
		},
		apiKeyInitVec: {
			type: Sequelize.TEXT,
			allowNull: true,
		},
		includeReleaseHtml: {
			type: Sequelize.BOOLEAN,
			allowNull: false,
			defaultValue: true,
		},
		includeAssets: {
			type: Sequelize.BOOLEAN,
			allowNull: false,
			defaultValue: true,
		},
		exportFormats: {
			type: Sequelize.JSONB,
			allowNull: false,
			defaultValue: ['pdf', 'epub'],
		},
		scheduleDays: {
			type: Sequelize.INTEGER,
			allowNull: true,
		},
		lastPushedAt: {
			type: Sequelize.DATE,
			allowNull: true,
		},
		lastPushSemver: {
			type: Sequelize.STRING,
			allowNull: true,
		},
		lastPushStatus: {
			type: Sequelize.STRING,
			allowNull: true,
		},
		lastPushError: {
			type: Sequelize.TEXT,
			allowNull: true,
		},
		lastManifestHash: {
			type: Sequelize.TEXT,
			allowNull: true,
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

	await sequelize.queryInterface.createTable('UnderlayPushEntries', {
		id: {
			type: Sequelize.UUID,
			primaryKey: true,
			defaultValue: Sequelize.UUIDV4,
			allowNull: false,
		},
		underlayIntegrationId: {
			type: Sequelize.UUID,
			allowNull: false,
			references: { model: 'UnderlayIntegrations', key: 'id' },
			onDelete: 'CASCADE',
		},
		pubId: {
			type: Sequelize.UUID,
			allowNull: false,
			references: { model: 'Pubs', key: 'id' },
			onDelete: 'CASCADE',
		},
		recordHashes: {
			type: Sequelize.JSONB,
			allowNull: false,
		},
		fileHashes: {
			type: Sequelize.JSONB,
			allowNull: false,
			defaultValue: [],
		},
		latestReleaseHistoryKey: {
			type: Sequelize.INTEGER,
			allowNull: true,
		},
		pubUpdatedAt: {
			type: Sequelize.DATE,
			allowNull: false,
		},
		optionsSignature: {
			type: Sequelize.STRING,
			allowNull: false,
		},
		facetsSignature: {
			type: Sequelize.STRING,
			allowNull: false,
			defaultValue: '',
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

	await sequelize.queryInterface.addIndex(
		'UnderlayPushEntries',
		['underlayIntegrationId', 'pubId'],
		{
			unique: true,
			name: 'underlay_push_entries_integration_id_pub_id',
		},
	);
};
