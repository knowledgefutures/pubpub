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
			indexes: [
				{ fields: ['communityId'], method: 'BTREE' },
				{ fields: ['collectionId'], method: 'BTREE' },
				{ fields: ['pubId'], method: 'BTREE' },
				{ fields: ['actorId'], method: 'BTREE' },
			],
		},
	);
};
