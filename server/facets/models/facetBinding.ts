export default (sequelize, dataTypes) => {
	return sequelize.define(
		'FacetBinding',
		{
			id: sequelize.idType,
			pubId: { type: dataTypes.UUID, allowNull: true },
			collectionId: { type: dataTypes.UUID, allowNull: true },
			communityId: { type: dataTypes.UUID, allowNull: true },
		},
		{
			indexes: [
				{ fields: ['communityId'], method: 'BTREE' },
				{ fields: ['collectionId'], method: 'BTREE' },
				{ fields: ['pubId'], method: 'BTREE' },
			],
			classMethods: {
				associate: (models) => {
					const { FacetBinding, Community, Collection, Pub } = models;
					FacetBinding.belongsTo(Community, {
						onDelete: 'CASCADE',
						as: 'community',
						foreignKey: 'communityId',
					});
					FacetBinding.belongsTo(Collection, {
						onDelete: 'CASCADE',
						as: 'collection',
						foreignKey: 'collectionId',
					});
					FacetBinding.belongsTo(Pub, {
						onDelete: 'CASCADE',
						as: 'pub',
						foreignKey: 'pubId',
					});
				},
			},
		},
	);
};
