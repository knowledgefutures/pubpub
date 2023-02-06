export const up = async ({ sequelize }) => {
	// PubHeaderTheme
	await sequelize.queryInterface.removeColumn('Pubs', 'headerBackgroundColor');
	await sequelize.queryInterface.removeColumn('Pubs', 'headerBackgroundImage');
	await sequelize.queryInterface.removeColumn('Pubs', 'headerStyle');
	// CitationStyle
	await sequelize.queryInterface.removeColumn('Pubs', 'citationStyle');
	await sequelize.queryInterface.removeColumn('Pubs', 'citationInlineStyle');
	// License
	await sequelize.queryInterface.removeColumn('Pubs', 'licenseSlug');
	// PubEdgeDisplay
	await sequelize.queryInterface.removeColumn('Pubs', 'pubEdgeListingDefaultsToCarousel');
	await sequelize.queryInterface.removeColumn('Pubs', 'pubEdgeDescriptionVisible');
	// NodeLabels
	await sequelize.queryInterface.removeColumn('Pubs', 'nodeLabels');
	// Facets transition scaffolding
	await sequelize.queryInterface.removeColumn('Pubs', 'facetsMigratedAt');
	// Other things we no longer use (now inferred from Releases)
	await sequelize.queryInterface.removeColumn('Pubs', 'firstPublishedAt');
	await sequelize.queryInterface.removeColumn('Pubs', 'lastPublishedAt');
};

export const down = async ({ Sequelize, sequelize }) => {
	// PubHeaderTheme
	await sequelize.queryInterface.addColumn('Pubs', 'headerBackgroundColor', {
		type: Sequelize.STRING,
		allowNull: true,
	});
	await sequelize.queryInterface.addColumn('Pubs', 'headerBackgroundImage', {
		type: Sequelize.TEXT,
		allowNull: true,
	});
	await sequelize.queryInterface.addColumn('Pubs', 'headerStyle', {
		// This was a Sequelize.ENUM, but whatever
		type: Sequelize.TEXT,
		allowNull: true,
		defaultValue: null,
	});
	// CitationStyle
	await sequelize.queryInterface.addColumn('Pubs', 'citationStyle', {
		type: Sequelize.TEXT,
		defaultValue: 'apa-7',
	});
	await sequelize.queryInterface.addColumn('Pubs', 'citationInlineStyle', {
		type: Sequelize.TEXT,
		defaultValue: 'count',
	});
	// License
	await sequelize.queryInterface.addColumn('Pubs', 'licenseSlug', {
		type: Sequelize.TEXT,
		defaultValue: 'cc-by',
	});
	// PubEdgeDisplay
	await sequelize.queryInterface.addColumn('Pubs', 'pubEdgeListingDefaultsToCarousel', {
		type: Sequelize.BOOLEAN,
		defaultValue: true,
		allowNull: false,
	});
	await sequelize.queryInterface.addColumn('Pubs', 'pubEdgeDescriptionVisible', {
		type: Sequelize.BOOLEAN,
		defaultValue: true,
		allowNull: false,
	});
	// NodeLabels
	await sequelize.queryInterface.addColumn('Pubs', 'nodeLabels', {
		type: Sequelize.JSONB,
		allowNull: true,
	});
	// Facets transition scaffolding
	await sequelize.queryInterface.addColumn('Pubs', 'facetsMigratedAt', {
		type: Sequelize.DATE,
		allowNull: true,
	});
	// Other things we no longer use (now inferred from Releases)
	await sequelize.queryInterface.addColumn('Pubs', 'firstPublishedAt', {
		type: Sequelize.DATE,
		allowNull: true,
	});
	await sequelize.queryInterface.addColumn('Pubs', 'lastPublishedAt', {
		type: Sequelize.DATE,
		allowNull: true,
	});
};
