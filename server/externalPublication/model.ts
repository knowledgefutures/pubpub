export default (sequelize, dataTypes) => {
	return sequelize.define('ExternalPublication', {
		title: { type: dataTypes.TEXT, allowNull: false },
		url: { type: dataTypes.TEXT, allowNull: false },
		contributors: { type: dataTypes.JSONB },
		doi: { type: dataTypes.TEXT },
		description: { type: dataTypes.TEXT },
		avatar: { type: dataTypes.TEXT },
		publicationDate: { type: dataTypes.DATE },
	});
};
