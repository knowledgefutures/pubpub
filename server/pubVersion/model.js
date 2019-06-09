export default (sequelize) => {
	const { Sequelize } = sequelize;
	return sequelize.define('PubVersion', {
		id: sequelize.idType,
		historyKey: { type: Sequelize.INTEGER },
		branchId: { type: Sequelize.UUID },
	});
};
