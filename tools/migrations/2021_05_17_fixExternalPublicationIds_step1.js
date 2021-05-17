export const up = async ({ sequelize, Sequelize }) => {
	await sequelize.queryInterface.addColumn('ExternalPublications', 'idNew', {
		type: Sequelize.UUID,
	});
	await sequelize.queryInterface.addColumn('PubEdges', 'externalPublicationIdNew', {
		type: Sequelize.UUID,
	});
};

export const down = async ({ sequelize }) => {
	await sequelize.queryInterface.removeColumn('ExternalPublications', 'idNew');
	await sequelize.queryInterface.removeColumn('PubEdges', 'externalPublicationIdNew');
};
