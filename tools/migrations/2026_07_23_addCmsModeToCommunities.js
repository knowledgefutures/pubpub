export const up = async ({ Sequelize, sequelize }) => {
	await sequelize.queryInterface.addColumn('Communities', 'cmsMode', {
		type: Sequelize.BOOLEAN,
		allowNull: false,
		defaultValue: false,
	});
	await sequelize.queryInterface.addColumn('Communities', 'canonicalBaseUrl', {
		type: Sequelize.TEXT,
		allowNull: true,
	});
	await sequelize.queryInterface.addColumn('Communities', 'canonicalPubUrlTemplate', {
		type: Sequelize.TEXT,
		allowNull: true,
	});
};

export const down = async ({ sequelize }) => {
	await sequelize.queryInterface.removeColumn('Communities', 'canonicalPubUrlTemplate');
	await sequelize.queryInterface.removeColumn('Communities', 'canonicalBaseUrl');
	await sequelize.queryInterface.removeColumn('Communities', 'cmsMode');
};
