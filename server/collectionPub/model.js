export default (sequelize, dataTypes) => {
	return sequelize.define(
		'CollectionPub',
		{
			id: sequelize.idType,
			pubId: { type: dataTypes.UUID, allowNull: false },
			collectionId: { type: dataTypes.UUID, allowNull: false },
			contextHint: { type: dataTypes.TEXT },
			rank: { type: dataTypes.TEXT, allowNull: false },
			pubRank: { type: dataTypes.TEXT, allowNull: false },
			isPrimary: { type: dataTypes.BOOLEAN, defaultValue: false, allowNull: false },
		},
		{
			indexes: [
				// Index to enforce that there is one CollectionPub per (collection, pub) pair
				{
					fields: ['collectionId', 'pubId'],
					unique: true,
				},
			],
			classMethods: {
				associate: (models) => {
					const { CollectionPub, Collection, Pub } = models;
					CollectionPub.belongsTo(Collection, {
						onDelete: 'CASCADE',
						as: 'collection',
						foreignKey: 'collectionId',
					});
					CollectionPub.belongsTo(Pub, {
						onDelete: 'CASCADE',
						as: 'pub',
						foreignKey: 'pubId',
					});
				},
			},
		},
	);
};
