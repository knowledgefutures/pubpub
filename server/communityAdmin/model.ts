export default (sequelize, dataTypes) => {
	return sequelize.define('CommunityAdmin', {
		id: sequelize.idType,

		/* Set by Associations */
		userId: { type: dataTypes.UUID, allowNull: false },
		communityId: { type: dataTypes.UUID, allowNull: false },
	});
};
