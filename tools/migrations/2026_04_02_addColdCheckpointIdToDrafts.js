export const up = async ({ Sequelize, sequelize }) => {
	// DraftCheckpoints table is created by sync(), but stepMapToKey is a new
	// column that may need to be added if the table already exists.
	const tableDesc = await sequelize.queryInterface.describeTable('DraftCheckpoints').catch(() => null);
	if (tableDesc && !tableDesc.stepMapToKey) {
		await sequelize.queryInterface.addColumn('DraftCheckpoints', 'stepMapToKey', {
			type: Sequelize.INTEGER,
			allowNull: true,
		});
	}
	// Remove coldCheckpointId if it exists from a previous version of this migration
	const draftsDesc = await sequelize.queryInterface.describeTable('Drafts');
	if (draftsDesc.coldCheckpointId) {
		await sequelize.queryInterface.removeColumn('Drafts', 'coldCheckpointId');
	}
};

export const down = async ({ Sequelize, sequelize }) => {
	const tableDesc = await sequelize.queryInterface.describeTable('DraftCheckpoints').catch(() => null);
	if (tableDesc?.stepMapToKey) {
		await sequelize.queryInterface.removeColumn('DraftCheckpoints', 'stepMapToKey');
	}
};
