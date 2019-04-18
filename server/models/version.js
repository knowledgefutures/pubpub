export default (sequelize) => {
	const Sequelize = sequelize.Sequelize;

	return sequelize.define('Version', {
		id: sequelize.idType,
		description: { type: Sequelize.TEXT },
		content: { type: Sequelize.JSONB },
		isPublic: { type: Sequelize.BOOLEAN }, // New
		isCommunityAdminShared: { type: Sequelize.BOOLEAN }, // New
		viewHash: { type: Sequelize.STRING }, // New

		/* Set by Associations */
		pubId: { type: Sequelize.UUID, allowNull: false },
	});
};
