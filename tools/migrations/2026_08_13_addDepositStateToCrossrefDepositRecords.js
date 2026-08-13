export const up = async ({ Sequelize, sequelize }) => {
	// All nullable, no default. A NULL status is meaningful: it marks a row that
	// predates deposit-state tracking, which the display rule in
	// utils/crossref/depositStatus.ts renders exactly as it always was. Giving
	// status a default of 'draft' or 'submitted' here would quietly relabel every
	// registered DOI in the archive as unconfirmed.
	await sequelize.queryInterface.addColumn('CrossrefDepositRecords', 'status', {
		type: Sequelize.TEXT,
		allowNull: true,
	});
	await sequelize.queryInterface.addColumn('CrossrefDepositRecords', 'doilyDepositId', {
		type: Sequelize.TEXT,
		allowNull: true,
	});
	await sequelize.queryInterface.addColumn('CrossrefDepositRecords', 'doi', {
		type: Sequelize.TEXT,
		allowNull: true,
	});
	await sequelize.queryInterface.addColumn('CrossrefDepositRecords', 'error', {
		type: Sequelize.TEXT,
		allowNull: true,
	});
	await sequelize.queryInterface.addColumn('CrossrefDepositRecords', 'lastCheckedAt', {
		type: Sequelize.DATE,
		allowNull: true,
	});
	// When the DOI first registered, straight from Doily's firstRegisteredAt.
	// Load-bearing rather than informational: deposit state is per attempt, so a
	// rejected UPDATE to an already-registered record reports status 'failed'
	// while doi.org keeps resolving it. Without this column the display rule
	// would pull a working DOI off pub pages and out of citations over stale
	// metadata. See isDoiPublic in utils/crossref/depositStatus.ts.
	await sequelize.queryInterface.addColumn('CrossrefDepositRecords', 'firstRegisteredAt', {
		type: Sequelize.DATE,
		allowNull: true,
	});
	// Both columns are looked up by a webhook handler that runs once per deposit
	// transition, so the lookup has to be an index hit rather than a scan of
	// every deposit PubPub has ever made.
	await sequelize.queryInterface.addIndex('CrossrefDepositRecords', ['doilyDepositId'], {
		name: 'crossref_deposit_records_doily_deposit_id_idx',
	});
	await sequelize.queryInterface.addIndex('CrossrefDepositRecords', ['doi'], {
		name: 'crossref_deposit_records_doi_idx',
	});
};

export const down = async ({ sequelize }) => {
	await sequelize.queryInterface.removeIndex(
		'CrossrefDepositRecords',
		'crossref_deposit_records_doi_idx',
	);
	await sequelize.queryInterface.removeIndex(
		'CrossrefDepositRecords',
		'crossref_deposit_records_doily_deposit_id_idx',
	);
	await sequelize.queryInterface.removeColumn('CrossrefDepositRecords', 'firstRegisteredAt');
	await sequelize.queryInterface.removeColumn('CrossrefDepositRecords', 'lastCheckedAt');
	await sequelize.queryInterface.removeColumn('CrossrefDepositRecords', 'error');
	await sequelize.queryInterface.removeColumn('CrossrefDepositRecords', 'doi');
	await sequelize.queryInterface.removeColumn('CrossrefDepositRecords', 'doilyDepositId');
	await sequelize.queryInterface.removeColumn('CrossrefDepositRecords', 'status');
};
