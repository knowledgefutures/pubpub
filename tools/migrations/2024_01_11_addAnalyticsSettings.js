// @ts-check

export const up = async ({ Sequelize, sequelize }) => {
	await sequelize.getQueryInterface().addColumn('Communities', 'analyticsSettings', {
		type: Sequelize.JSONB,
		defaultValue: null,
	});
};

export const down = async ({ sequelize }) => {
	await sequelize.getQueryInterface().removeColumn('Communities', 'analyticsSettings');
};
