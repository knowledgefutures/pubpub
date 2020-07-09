export default (sequelize, dataTypes) => {
	return sequelize.define(
		'PubEdge',
		{
			id: sequelize.idType,
			pubId: { type: dataTypes.UUID, allowNull: false },
			targetExternalPublication: { type: dataTypes.UUID, allowNull: true },
			targetPubId: { type: dataTypes.UUID, allowNull: true },
			relationType: { type: dataTypes.STRING, allowNull: false },
			rank: { type: dataTypes.TEXT, allowNull: false },
			pubIsParent: { type: dataTypes.BOOLEAN, allowNull: false },
			approvedByTarget: { type: dataTypes.BOOLEAN, allowNull: false },
		},
		{
			classMethods: {
				associate: ({ PubEdge, Pub, ExternalPublication }) => {
					PubEdge.belongsTo(Pub, {
						onDelete: 'CASCADE',
						as: 'pub',
						foreignKey: 'pubId',
					});
					PubEdge.belongsTo(Pub, {
						onDelete: 'CASCADE',
						as: 'targetPub',
						foreignKey: 'targetPubId',
					});
					PubEdge.belongsTo(ExternalPublication, {
						onDelete: 'CASCADE',
						as: 'externalPublication',
						foreignKey: 'externalPublicationId',
					});
				},
			},
		},
	);
};
