export const up = async ({ sequelize }) => {
	// strip orcid.org URL prefixes from all orcid columns, leaving just the bare identifier.
	// handles http/https and optional www prefix.
	const tables = ['Users', 'PubAttributions', 'CollectionAttributions'];

	for (const table of tables) {
		const [, meta] = await sequelize.query(
			`UPDATE "${table}"
			 SET orcid = regexp_replace(orcid, '^https?://(?:www\\.)?orcid\\.org/', '')
			 WHERE orcid LIKE '%orcid.org/%'`,
		);

		const count = meta?.rowCount ?? meta;
		if (count > 0) {
			console.info(`${table}: normalized ${count} orcid(s)`);
		}
	}
};

export const down = async () => {
	// not reversible -- the bare identifiers are strictly more correct than the URLs
	throw new Error('Irreversible migration: orcid normalization cannot be undone');
};
