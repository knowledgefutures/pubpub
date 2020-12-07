export default (sequelize, dataTypes) => {
	return sequelize.define(
		'Visibility',
		{
			id: sequelize.idType,
			access: {
				type: dataTypes.ENUM,
				values: ['private', 'members', 'public'],
				defaultValue: 'private',
			},
		},
		{
			classMethods: {
				associate: (models) => {
					const { Visibility, User } = models;
					Visibility.belongsToMany(User, {
						as: 'users',
						through: 'VisibilityUser',
						foreignKey: 'visibilityId',
					});
				},
			},
		},
	);
};
