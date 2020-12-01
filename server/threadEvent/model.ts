export default (sequelize, dataTypes) => {
	return sequelize.define(
		'ThreadEvent',
		{
			id: sequelize.idType,
			type: { type: dataTypes.STRING },
			data: { type: dataTypes.JSONB },
			/* Set by Associations */
			userId: { type: dataTypes.UUID, allowNull: false },
			threadId: { type: dataTypes.UUID, allowNull: false },
		},
		{
			classMethods: {
				associate: (models) => {
					const { User, ThreadEvent } = models;
					ThreadEvent.belongsTo(User, {
						onDelete: 'CASCADE',
						as: 'user',
						foreignKey: 'userId',
					});
				},
			},
		},
	);
};
