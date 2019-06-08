export default (sequelize, dataTypes) => {
	return sequelize.define('WorkerTask', {
		id: sequelize.idType,
		type: { type: dataTypes.TEXT, allowNull: false },
		input: { type: dataTypes.JSONB },
		isProcessing: { type: dataTypes.BOOLEAN },
		attemptCount: { type: dataTypes.INTEGER },
		error: { type: dataTypes.JSONB },
		output: { type: dataTypes.JSONB },
	});
};
