export default (sequelize, dataTypes) => {
	return sequelize.define('VisibilityUser', {
		id: sequelize.idType,

		/* Set by Associations */
		userId: { type: dataTypes.UUID, allowNull: false },
		visibilityId: { type: dataTypes.UUID, allowNull: false },
	});
};
