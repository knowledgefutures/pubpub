export default (sequelize) => {
	const Sequelize = sequelize.Sequelize;

	return sequelize.define(
		'CollectionPub',
		{
			id: sequelize.idType,
			pubId: { type: Sequelize.UUID, allowNull: false },
			collectionId: { type: Sequelize.UUID, allowNull: false },
			contextHint: { type: Sequelize.TEXT },
			rank: { type: Sequelize.TEXT },
			isPrimary: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
		},
		{
			indexes: [
				// Index to maintain invariant that every pub have at most one primary collection
				{
					fields: ['pubId'],
					where: {
						isPrimary: true,
					},
					unique: true,
				},
				// Index to enforce that there is one CollectionPub per (collection, pub) pair
				{
					fields: ['collectionId', 'pubId'],
					unique: true,
				},
			],
			classMethods: {
				associate: (models) => {
					const { CollectionPub, Collection } = models;
					CollectionPub.belongsTo(Collection, {
						onDelete: 'CASCADE',
						as: 'collection',
						foreignKey: 'collectionId',
					});
				},
			},
		},
	);
};
