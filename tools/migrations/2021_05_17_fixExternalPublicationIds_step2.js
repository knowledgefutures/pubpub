export const up = async ({ sequelize }) => {
	await sequelize.queryInterface.renameColumn('ExternalPublications', 'id', 'idOld');
	await sequelize.queryInterface.renameColumn('ExternalPublications', 'idNew', 'id');

	await sequelize.queryInterface.renameColumn(
		'PubEdges',
		'externalPublicationId',
		'externalPublicationIdOld',
	);
	await sequelize.queryInterface.renameColumn(
		'PubEdges',
		'externalPublicationIdNew',
		'externalPublicationId',
	);
};
