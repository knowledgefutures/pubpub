/**
 * Drop Communities.kfOrgId. KF Account ownership is removed for now; organizations will
 * replace it. Works whether or not 2026_06_15_makeKfOrgIdNotNull ran.
 */
export const up = async ({ sequelize }) => {
	await sequelize.query('DROP INDEX IF EXISTS "communities_kf_org_id_idx"');
	await sequelize.query('ALTER TABLE "Communities" DROP COLUMN IF EXISTS "kfOrgId"');
};

export const down = async ({ Sequelize, sequelize }) => {
	await sequelize.queryInterface.addColumn('Communities', 'kfOrgId', {
		type: Sequelize.TEXT,
		allowNull: true,
	});
	await sequelize.queryInterface.addIndex('Communities', ['kfOrgId'], {
		name: 'communities_kf_org_id_idx',
	});
};
