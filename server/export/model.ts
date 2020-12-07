export default (sequelize, dataTypes) => {
	return sequelize.define(
		'Export',
		{
			id: sequelize.idType,
			branchId: { type: dataTypes.UUID, allowNull: false },
			format: { type: dataTypes.STRING, allowNull: false },
			url: { type: dataTypes.STRING, allowNull: true },
			historyKey: { type: dataTypes.INTEGER, allowNull: false },
			pubId: { type: dataTypes.UUID, allowNull: false },
			workerTaskId: { type: dataTypes.UUID, allowNull: true },
		},
		{
			classMethods: {
				associate: (models) => {
					const { Export, WorkerTask } = models;
					Export.belongsTo(WorkerTask, {
						onDelete: 'SET NULL',
						as: 'workerTask',
						foreignKey: 'workerTaskId',
					});
				},
			},
		},
	);
};
