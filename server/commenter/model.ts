export default (sequelize, dataTypes) => {
	return sequelize.define('Commenter', {
		id: sequelize.idType,
		name: { type: dataTypes.TEXT },
	});
};
