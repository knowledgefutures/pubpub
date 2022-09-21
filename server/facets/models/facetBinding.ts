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
		},
	);
};
