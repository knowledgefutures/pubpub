export default (sequelize, dataTypes) => {
	return sequelize.define(
		'UserDismissable',
		{
			id: sequelize.idType,
			key: { type: dataTypes.STRING, allowNull: false },
			userId: { type: dataTypes.UUID, allowNull: false },
		},
		{
			indexes: [{ fields: ['userId'], method: 'BTREE' }],
		},
	);
};
