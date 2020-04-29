export default (sequelize, dataTypes) => {
	return sequelize.define('Release', {
		id: sequelize.idType,
		noteContent: { type: dataTypes.JSONB },
		noteText: { type: dataTypes.TEXT },
		branchKey: { type: dataTypes.INTEGER },
		/* Set by Associations */
		pubId: { type: dataTypes.UUID, allowNull: false },
		branchId: { type: dataTypes.UUID, allowNull: false },
		userId: { type: dataTypes.UUID, allowNull: false },
		/* Todo: We should be able to deprecate the following source ids */
		sourceBranchId: { type: dataTypes.UUID },
		sourceBranchKey: { type: dataTypes.INTEGER },
	});
};
