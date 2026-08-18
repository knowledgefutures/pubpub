/**
 * Caches the Doily organization a community deposits under.
 *
 * Before this, PubPub found it by listing every Doily organization and matching
 * `org.slug === community.subdomain`, holding the answer only in a
 * process-local Map. Subdomains are editable, so after a rename the lookup
 * missed, the provisioning path treated the community as new, and a SECOND
 * Doily organization was created — future deposits landing there while the DOI
 * history stayed behind under the old one, on separate credentials and
 * potentially a separate billing account.
 *
 * Doily's `installation` table, keyed on (appId, externalId = community.id), is
 * authoritative; this column is only a cache so the deposit path does not pay
 * an HTTP round trip per cold process. Indexed because the reconciliation
 * script needs to find two communities pointing at one organization.
 */
export const up = async ({ Sequelize, sequelize }) => {
	await sequelize.queryInterface.addColumn('Communities', 'doilyOrgId', {
		type: Sequelize.TEXT,
		allowNull: true,
	});
	await sequelize.queryInterface.addIndex('Communities', ['doilyOrgId'], {
		name: 'communities_doily_org_id_idx',
	});
};

export const down = async ({ sequelize }) => {
	await sequelize.queryInterface.removeIndex('Communities', 'communities_doily_org_id_idx');
	await sequelize.queryInterface.removeColumn('Communities', 'doilyOrgId');
};
