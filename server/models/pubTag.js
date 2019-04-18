export default (sequelize) => {
	const Sequelize = sequelize.Sequelize;

	return sequelize.define('PubTag', {
		id: sequelize.idType,

		/* Set by Associations */
		pubId: { type: Sequelize.UUID },
		collectionId: { type: Sequelize.UUID },
	});
};
