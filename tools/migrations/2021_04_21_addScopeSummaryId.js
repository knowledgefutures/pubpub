const tables = ['Pubs', 'Collections', 'Communities'];

export const up = async ({ sequelize, Sequelize }) => {
	await Promise.all(
		tables.map((table) =>
			sequelize.queryInterface.addColumn(table, 'scopeSummaryId', {
				type: Sequelize.UUID,
				allowNull: true,
				references: {
					model: 'ScopeSummaries',
					key: 'id',
				},
			}),
		),
	);
};

export const down = async ({ sequelize }) => {
	await Promise.all(
		tables.map((table) => sequelize.queryInterface.removeColumn(table, 'scopeSummaryId')),
	);
};
