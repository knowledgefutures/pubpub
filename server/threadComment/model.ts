export default (sequelize, dataTypes) => {
	return sequelize.define(
		'ThreadComment',
		{
			id: sequelize.idType,
			text: { type: dataTypes.TEXT },
			content: { type: dataTypes.JSONB },
			/* Set by Associations */
			userId: { type: dataTypes.UUID, allowNull: false },
			threadId: { type: dataTypes.UUID, allowNull: false },
		},
		{
			classMethods: {
				associate: (models) => {
					const { ThreadComment, User } = models;
					ThreadComment.belongsTo(User, {
						onDelete: 'CASCADE',
						as: 'author',
						foreignKey: 'userId',
					});
				},
			},
		},
	);
};
