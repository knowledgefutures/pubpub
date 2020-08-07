module.exports = async ({ Sequelize, sequelize }) => {
	await sequelize.queryInterface.addColumn('Pubs', 'crossrefDepositRecordId', {
		type: Sequelize.UUID,
		allowNull: true,
		references: {
			model: 'CrossrefDepositRecords',
			key: 'id',
		},
	});
	await sequelize.queryInterface.addColumn('Collections', 'crossrefDepositRecordId', {
		type: Sequelize.UUID,
		allowNull: true,
		references: {
			model: 'CrossrefDepositRecords',
			key: 'id',
		},
	});
};
