export default (sequelize, dataTypes) => {
	return sequelize.define(
		'ThreadUser',
		{
			id: sequelize.idType,
			type: {
				type: dataTypes.ENUM,
				values: ['viewer', 'reviewer'],
				defaultValue: 'viewer',
			},
			email: {
				type: dataTypes.TEXT,
				validate: {
					isEmail: true,
					isLowercase: true,
				},
			},
			hash: { type: dataTypes.TEXT },

			/* Set by Associations */
			userId: { type: dataTypes.UUID },
			threadId: { type: dataTypes.UUID, allowNull: false },
		},
		{
			classMethods: {
				associate: (models) => {
					const { ThreadUser, User } = models;
					ThreadUser.belongsTo(User, {
						onDelete: 'CASCADE',
						as: 'user',
						foreignKey: 'userId',
					});
				},
			},
		},
	);
};
