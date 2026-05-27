/**
 * Phase D cleanup: Make kfOrgId NOT NULL on Communities.
 *
 * Run this ONLY after confirming all communities have been assigned
 * a kfOrgId value (from the seed script + new community creation).
 */

export const up = async ({ Sequelize, sequelize }) => {
	// First verify there are no NULL values
	const [results] = await sequelize.query(
		`SELECT count(*) as count FROM "Communities" WHERE "kfOrgId" IS NULL`,
	);
	const nullCount = parseInt(results[0].count, 10);

	if (nullCount > 0) {
		throw new Error(
			`Cannot make kfOrgId NOT NULL: ${nullCount} communities still have NULL kfOrgId. ` +
				`Assign ownership first, then re-run this migration.`,
		);
	}

	await sequelize.queryInterface.changeColumn('Communities', 'kfOrgId', {
		type: Sequelize.TEXT,
		allowNull: false,
	});
};

export const down = async ({ Sequelize, sequelize }) => {
	await sequelize.queryInterface.changeColumn('Communities', 'kfOrgId', {
		type: Sequelize.TEXT,
		allowNull: true,
	});
};
