export default (sequelize, dataTypes) => {
	return sequelize.define('Doc', {
		id: sequelize.idType,
		content: { type: dataTypes.JSONB, allowNull: false },
	});
};
