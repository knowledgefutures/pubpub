export const up = async ({ Sequelize, sequelize }) => {
	await sequelize.queryInterface.addColumn('Communities', 'kfOrgId', {
		type: Sequelize.TEXT,
		allowNull: true,
	});
	await sequelize.queryInterface.addIndex('Communities', ['kfOrgId'], {
		name: 'communities_kf_org_id_idx',
	});
};

export const down = async ({ sequelize }) => {
	await sequelize.queryInterface.removeIndex(
		'Communities',
		'communities_kf_org_id_idx',
	);
	await sequelize.queryInterface.removeColumn('Communities', 'kfOrgId');
};
