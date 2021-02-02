export default (sequelize, dataTypes) => {
	return sequelize.define('Anchor', {
		id: sequelize.idType,
		prefix: { type: dataTypes.TEXT },
		exact: { type: dataTypes.TEXT },
		suffix: { type: dataTypes.TEXT },
		from: { type: dataTypes.INTEGER },
		to: { type: dataTypes.INTEGER },
		branchKey: { type: dataTypes.INTEGER },
		branchId: { type: dataTypes.UUID },
	});
};
