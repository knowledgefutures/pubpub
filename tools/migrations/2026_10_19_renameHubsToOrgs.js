/**
 * Rename Hubs to Orgs (phase 1 of PubPub Orgs, no behavior change):
 *   Hubs → Orgs, HubManagers → OrgMembers, HubPubs → OrgFeaturedPubs,
 *   hubId → orgId on those tables and on CommunityTemplates, HubCommunities and HubOptOuts.
 * Adds Orgs.kfOrgId (nullable for now) and Communities.orgId (nullable).
 * HubCommunities and HubOptOuts keep their table names until phase 2 drops them.
 *
 * tools/migrate.js (and server startup) run sequelize.sync() first, which creates empty
 * Orgs, OrgMembers and OrgFeaturedPubs tables from the new models. Those are dropped here,
 * if empty, before the old tables are renamed onto them. down does the same in reverse.
 */

const TABLES = [
	['Hubs', 'Orgs'],
	['HubManagers', 'OrgMembers'],
	['HubPubs', 'OrgFeaturedPubs'],
];

const ENUMS = [
	['enum_Hubs_communityCloneAccess', 'enum_Orgs_communityCloneAccess'],
	['enum_HubPubs_dataAccess', 'enum_OrgFeaturedPubs_dataAccess'],
];

// Tables with an FK column to Hubs/Orgs, by their post-rename names
const FK_TABLES = ['OrgMembers', 'OrgFeaturedPubs', 'CommunityTemplates', 'HubCommunities', 'HubOptOuts'];

// Tables whose index and constraint names are renamed, by their post-rename names
const NAMED_TABLES = ['Orgs', 'OrgMembers', 'OrgFeaturedPubs', 'CommunityTemplates'];

const NAME_PARTS = [
	['HubManagers', 'OrgMembers'],
	['hub_managers', 'org_members'],
	['HubPubs', 'OrgFeaturedPubs'],
	['hub_pubs', 'org_featured_pubs'],
	['Hubs', 'Orgs'],
	['hubs_', 'orgs_'],
	['hubId', 'orgId'],
	['hub_id', 'org_id'],
];

const withTransaction = (sequelize, fn) =>
	sequelize.transaction(async (transaction) => {
		const query = (sql, replacements = {}) =>
			sequelize.query(sql, {
				transaction,
				replacements,
				type: 'SELECT',
			});
		const run = (sql) => sequelize.query(sql, { transaction });
		const tableExists = async (table) => {
			const [row] = await query('SELECT to_regclass(:name) AS oid', { name: `"${table}"` });
			return row.oid !== null;
		};
		const columnExists = async (table, column) => {
			const rows = await query(
				`SELECT 1 FROM information_schema.columns
				 WHERE table_schema = current_schema() AND table_name = :table AND column_name = :column`,
				{ table, column },
			);
			return rows.length > 0;
		};
		const typeExists = async (type) => {
			const rows = await query('SELECT 1 FROM pg_type WHERE typname = :type', { type });
			return rows.length > 0;
		};
		const dropIfEmpty = async (table) => {
			if (!(await tableExists(table))) return;
			const [{ count }] = await query(`SELECT count(*)::int AS count FROM "${table}"`);
			if (count > 0) {
				throw new Error(`"${table}" already has ${count} rows; refusing to replace it.`);
			}
			await run(`DROP TABLE "${table}"`);
		};
		const renameNames = async (table, parts) => {
			const rename = (name) => parts.reduce((acc, [from, to]) => acc.split(from).join(to), name);
			// Renaming a constraint also renames the index behind it (pkey, unique)
			const constraints = await query(
				'SELECT conname FROM pg_constraint WHERE conrelid = to_regclass(:name)',
				{ name: `"${table}"` },
			);
			for (const { conname } of constraints) {
				const next = rename(conname);
				if (next !== conname) {
					await run(`ALTER TABLE "${table}" RENAME CONSTRAINT "${conname}" TO "${next}"`);
				}
			}
			const indexes = await query(
				'SELECT indexname FROM pg_indexes WHERE schemaname = current_schema() AND tablename = :table',
				{ table },
			);
			for (const { indexname } of indexes) {
				const next = rename(indexname);
				if (next !== indexname) {
					await run(`ALTER INDEX "${indexname}" RENAME TO "${next}"`);
				}
			}
		};
		return fn({ run, tableExists, columnExists, typeExists, dropIfEmpty, renameNames });
	});

export const up = async ({ sequelize }) => {
	await withTransaction(
		sequelize,
		async ({ run, tableExists, columnExists, typeExists, dropIfEmpty, renameNames }) => {
			// Children first, so no FK blocks the drop
			for (const [from, to] of [...TABLES].reverse()) {
				if (await tableExists(from)) await dropIfEmpty(to);
			}
			for (const [from, to] of ENUMS) {
				if (await typeExists(from)) {
					await run(`DROP TYPE IF EXISTS "${to}"`);
					await run(`ALTER TYPE "${from}" RENAME TO "${to}"`);
				}
			}
			for (const [from, to] of TABLES) {
				if (await tableExists(from)) await run(`ALTER TABLE "${from}" RENAME TO "${to}"`);
			}
			for (const table of FK_TABLES) {
				if (await columnExists(table, 'hubId')) {
					await run(`ALTER TABLE "${table}" RENAME COLUMN "hubId" TO "orgId"`);
				}
			}
			for (const table of NAMED_TABLES) {
				await renameNames(table, NAME_PARTS);
			}

			if (!(await columnExists('Orgs', 'kfOrgId'))) {
				await run('ALTER TABLE "Orgs" ADD COLUMN "kfOrgId" TEXT');
			}
			await run('CREATE INDEX IF NOT EXISTS "orgs_kf_org_id" ON "Orgs" ("kfOrgId")');
			if (!(await columnExists('Communities', 'orgId'))) {
				await run(
					`ALTER TABLE "Communities" ADD COLUMN "orgId" UUID
					 REFERENCES "Orgs" ("id") ON DELETE SET NULL ON UPDATE CASCADE`,
				);
			}
			await run('CREATE INDEX IF NOT EXISTS "communities_org_id" ON "Communities" ("orgId")');
		},
	);
};

export const down = async ({ sequelize }) => {
	await withTransaction(
		sequelize,
		async ({ run, tableExists, columnExists, typeExists, dropIfEmpty, renameNames }) => {
			// Children first, so no FK blocks the drop
			for (const [from, to] of [...TABLES].reverse()) {
				if (await tableExists(to)) await dropIfEmpty(from);
			}
			await run('DROP INDEX IF EXISTS "communities_org_id"');
			await run('ALTER TABLE "Communities" DROP COLUMN IF EXISTS "orgId"');
			await run('DROP INDEX IF EXISTS "orgs_kf_org_id"');
			if (await tableExists('Orgs')) {
				await run('ALTER TABLE "Orgs" DROP COLUMN IF EXISTS "kfOrgId"');
			}

			for (const table of NAMED_TABLES) {
				await renameNames(
					table,
					NAME_PARTS.map(([from, to]) => [to, from]),
				);
			}
			for (const table of FK_TABLES) {
				if (await columnExists(table, 'orgId')) {
					await run(`ALTER TABLE "${table}" RENAME COLUMN "orgId" TO "hubId"`);
				}
			}
			for (const [from, to] of ENUMS) {
				if (await typeExists(to)) {
					await run(`DROP TYPE IF EXISTS "${from}"`);
					await run(`ALTER TYPE "${to}" RENAME TO "${from}"`);
				}
			}
			for (const [from, to] of TABLES) {
				if (await tableExists(to)) await run(`ALTER TABLE "${to}" RENAME TO "${from}"`);
			}
		},
	);
};
