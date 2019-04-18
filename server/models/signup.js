export default (sequelize) => {
	const Sequelize = sequelize.Sequelize;

	return sequelize.define('Signup', {
		id: sequelize.idType,
		email: {
			type: Sequelize.TEXT,
			allowNull: false,
			unique: true,
			validate: {
				isEmail: true,
				isLowercase: true,
			},
		},
		hash: { type: Sequelize.TEXT },
		count: { type: Sequelize.INTEGER },
		completed: { type: Sequelize.BOOLEAN },
		communityId: { type: Sequelize.UUID },
	});
};
