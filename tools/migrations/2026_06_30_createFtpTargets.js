module.exports = async ({ Sequelize, sequelize }) => {
	await sequelize.queryInterface.createTable('FtpTargets', {
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
		ftpType: {
			type: Sequelize.ENUM('sftp', 'ftps'),
			allowNull: true,
		},
		port: {
			type: Sequelize.INTEGER,
			allowNull: true,
		},
		host: {
			type: Sequelize.STRING,
			allowNull: true,
		},
		filePath: {
			type: Sequelize.STRING,
			allowNull: true,
		},
		username: {
			type: Sequelize.STRING,
			allowNull: true,
		},
		password: {
			type: Sequelize.STRING,
			allowNull: true,
		},
		passwordInitVec: {
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
};
