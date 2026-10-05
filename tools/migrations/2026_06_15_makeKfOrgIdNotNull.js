/**
 * Phase D cleanup: Make kfOrgId NOT NULL on Communities.
 *
 * SUPERSEDED by 2026_10_05_makeKfOrgIdNullable. kfOrgId is staff-set billing
 * attribution and may be NULL (users who sign up through kf-console have no
 * personal org), so `up` refuses to run. `down` is kept so the constraint can
 * still be removed where this was applied.
 */

export const up = async () => {
	throw new Error(
		'2026_06_15_makeKfOrgIdNotNull is superseded by 2026_10_05_makeKfOrgIdNullable; ' +
			'kfOrgId must stay nullable.',
	);
};

export const down = async ({ Sequelize, sequelize }) => {
	await sequelize.queryInterface.changeColumn('Communities', 'kfOrgId', {
		type: Sequelize.TEXT,
		allowNull: true,
	});
};
