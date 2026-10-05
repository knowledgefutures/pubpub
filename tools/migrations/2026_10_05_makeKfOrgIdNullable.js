/**
 * Make Communities.kfOrgId nullable again, undoing 2026_06_15_makeKfOrgIdNotNull.
 *
 * kfOrgId is billing attribution set by KF staff, not ownership a user has to
 * pick at creation. Users who sign up through kf-console get no personal org,
 * so their orgs claim is empty and create-community sends no kfOrgId; with the
 * NOT NULL constraint in place that insert fails.
 *
 * Safe to run whether or not the NOT NULL migration was ever applied.
 */

export const up = async ({ Sequelize, sequelize }) => {
	await sequelize.queryInterface.changeColumn('Communities', 'kfOrgId', {
		type: Sequelize.TEXT,
		allowNull: true,
	});
};

export const down = async ({ Sequelize, sequelize }) => {
	const [results] = await sequelize.query(
		`SELECT count(*) as count FROM "Communities" WHERE "kfOrgId" IS NULL`,
	);
	const nullCount = parseInt(results[0].count, 10);

	if (nullCount > 0) {
		throw new Error(
			`Cannot make kfOrgId NOT NULL: ${nullCount} communities have NULL kfOrgId. ` +
				`Assign them an org first, then re-run this migration.`,
		);
	}

	await sequelize.queryInterface.changeColumn('Communities', 'kfOrgId', {
		type: Sequelize.TEXT,
		allowNull: false,
	});
};
