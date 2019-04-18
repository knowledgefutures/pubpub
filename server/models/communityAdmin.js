export default (sequelize) => {
	const Sequelize = sequelize.Sequelize;

	return sequelize.define('CommunityAdmin', {
		id: sequelize.idType,

		/* Set by Associations */
		userId: { type: Sequelize.UUID, allowNull: false },
		communityId: { type: Sequelize.UUID, allowNull: false },
	});
};
