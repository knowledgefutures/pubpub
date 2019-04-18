export default (sequelize) => {
	const Sequelize = sequelize.Sequelize;

	return sequelize.define('WorkerTask', {
		id: sequelize.idType,
		type: { type: Sequelize.TEXT, allowNull: false },
		input: { type: Sequelize.JSONB },
		isProcessing: { type: Sequelize.BOOLEAN },
		attemptCount: { type: Sequelize.INTEGER },
		error: { type: Sequelize.JSONB },
		output: { type: Sequelize.JSONB },
	});
};
