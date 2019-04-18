export default (sequelize, dataTypes) => {
	return sequelize.define('Branch', {
		id: sequelize.idType,
		shortId: { type: dataTypes.INTEGER, allowNull: false },
		title: { type: dataTypes.TEXT },
		description: { type: dataTypes.TEXT },
		order: { type: dataTypes.DOUBLE },
		communityAdminPermissions: {
			type: dataTypes.ENUM,
			values: ['none', 'view', 'discuss', 'edit', 'manage'],
			defaultValue: 'none',
		},
		// pubManagerPermissions
		publicPermissions: {
			type: dataTypes.ENUM,
			values: ['none', 'view', 'discuss', 'edit'],
			defaultValue: 'none',
		},
		viewHash: { type: dataTypes.STRING },
		editHash: { type: dataTypes.STRING },

		/* Set by Associations */
		pubId: { type: dataTypes.UUID, allowNull: false },
	});
};
