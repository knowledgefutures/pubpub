export default (sequelize, dataTypes) => {
	return sequelize.define('CrossrefDepositRecord', {
		id: sequelize.idType,
		depositJson: dataTypes.JSONB,
	});
};
