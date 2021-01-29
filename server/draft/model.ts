export default (sequelize, dataTypes) => {
	return sequelize.define(
		'Draft',
		{
			id: sequelize.idType,
			latestKeyAt: { type: dataTypes.DATE },
			firebasePath: { type: dataTypes.STRING, allowNull: false },
		},
		{
			classMethods: {
				associate: (models) => {
					const { Pub, Draft } = models;
					Pub.belongsTo(Draft, {
						as: 'draft',
						foreignKey: 'draftId',
					});
				},
			},
		},
	);
};
