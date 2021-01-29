export default (sequelize, dataTypes) => {
	return sequelize.define(
		'Release',
		{
			id: sequelize.idType,
			noteContent: { type: dataTypes.JSONB },
			noteText: { type: dataTypes.TEXT },
			/* Set by Associations */
			pubId: { type: dataTypes.UUID, allowNull: false },
			userId: { type: dataTypes.UUID, allowNull: false },
			docId: { type: dataTypes.UUID, allowNull: false },
			historyKey: { type: dataTypes.INTEGER, allowNull: false },
			historyKeyMissing: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },
		},
		{
			classMethods: {
				associate: (models) => {
					const { Doc, Release } = models;
					Release.belongsTo(Doc, {
						as: 'doc',
						foreignKey: 'docId',
					});
				},
			},
		},
	);
};
