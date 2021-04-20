export default (sequelize, dataTypes) => {
	return sequelize.define('CustomScript', {
		id: sequelize.idType,
		communityId: dataTypes.UUID,
		type: dataTypes.STRING,
		content: dataTypes.TEXT,
	});
};
