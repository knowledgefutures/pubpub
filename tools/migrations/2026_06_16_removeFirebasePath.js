/**
 * Final cleanup migration: removes the firebasePath column from Drafts.
 * Run ONLY after all drafts have been fully migrated to Pitter Patter
 * and the Firebase migration tool has been run successfully.
 */

export const up = async ({ Sequelize, sequelize }) => {
	const qi = sequelize.queryInterface;
	const draftsDesc = await qi.describeTable('Drafts');

	if (draftsDesc.firebasePath) {
		await qi.removeColumn('Drafts', 'firebasePath');
	}
};

export const down = async ({ Sequelize, sequelize }) => {
	const qi = sequelize.queryInterface;
	const draftsDesc = await qi.describeTable('Drafts');

	if (!draftsDesc.firebasePath) {
		await qi.addColumn('Drafts', 'firebasePath', {
			type: Sequelize.STRING,
			allowNull: true,
		});
	}
};
