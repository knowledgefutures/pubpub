export default (sequelize, dataTypes) => {
	return sequelize.define(
		'Thread',
		{
			id: sequelize.idType,
			isLocked: { type: dataTypes.BOOLEAN },
		},
		{
			classMethods: {
				associate: (models) => {
					const { Thread, ThreadComment, ThreadEvent } = models;
					Thread.hasMany(ThreadComment, {
						onDelete: 'CASCADE',
						as: 'comments',
						foreignKey: 'threadId',
					});
					Thread.hasMany(ThreadEvent, {
						onDelete: 'CASCADE',
						as: 'events',
						foreignKey: 'threadId',
					});
				},
			},
		},
	);
};
