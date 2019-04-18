export default (sequelize) => {
	const Sequelize = sequelize.Sequelize;

	return sequelize.define('Tag', {
		id: sequelize.idType,
		title: { type: Sequelize.TEXT },
		isRestricted: {
			type: Sequelize.BOOLEAN,
		} /* Restricted tags can only be set by Community Admins */,
		isPublic: { type: Sequelize.BOOLEAN } /* Only visible to community admins */,

		/* Set by Associations */
		pageId: { type: Sequelize.UUID } /* Used to link a tag to a specific page */,
		communityId: { type: Sequelize.UUID, allowNull: false },
	});
};
