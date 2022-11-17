export default (sequelize, dataTypes) => {
	return sequelize.define(
		'ThreadComment',
		{
			id: sequelize.idType,
			text: { type: dataTypes.TEXT },
			content: { type: dataTypes.JSONB },
			/* Set by Associations */
			userId: { type: dataTypes.UUID },
			threadId: { type: dataTypes.UUID, allowNull: false },
			commenterId: { type: dataTypes.UUID },
		},
		{
			classMethods: {
				associate: (models) => {
					const { Commenter, ThreadComment, User } = models;
					ThreadComment.belongsTo(User, {
						onDelete: 'CASCADE',
						as: 'author',
						foreignKey: 'userId',
					});
					ThreadComment.belongsTo(Commenter, {
						onDelete: 'CASCADE',
						as: 'commenter',
						foreignKey: 'commenterId',
					});
				},
			},
		},
	);
};
