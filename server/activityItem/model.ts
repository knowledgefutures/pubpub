export default (sequelize, dataTypes) => {
	return sequelize.define(
		'ActivityItem',
		{
			id: sequelize.idType,
			kind: { type: dataTypes.TEXT, allowNull: false },
			pubId: { type: dataTypes.UUID },
			payload: { type: dataTypes.JSONB },
			timestamp: {
				type: dataTypes.DATE,
				defaultValue: sequelize.Sequelize.NOW,
				allowNull: false,
			},
			communityId: { type: dataTypes.UUID, allowNull: false },
			actorId: { type: dataTypes.UUID },
			collectionId: { type: dataTypes.UUID },
		},
		{
			classMethods: {
				associate: (models) => {
					const { ActivityItem, Community, Collection, Pub, User } = models;
					ActivityItem.belongsTo(Community, {
						as: 'community',
						foreignKey: 'communityId',
					});
					ActivityItem.belongsTo(Collection, {
						as: 'collection',
						foreignKey: 'collectionId',
					});
					ActivityItem.belongsTo(Pub, {
						as: 'pub',
						foreignKey: 'pubId',
					});
					ActivityItem.belongsTo(User, {
						as: 'actor',
						foreignKey: 'actorId',
					});
				},
			},
		},
	);
};
