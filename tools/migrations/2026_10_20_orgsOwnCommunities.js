/**
 * Orgs phase 2: orgs own communities (Communities.orgId) instead of curating them.
 *
 *   - Deletes every existing org. They are the old hubs, which were never public, and none has
 *     a KF Account. Their templates are deactivated first, since a template without an org is
 *     usable by anyone who knows its id.
 *   - Orgs.kfOrgId becomes NOT NULL.
 *   - OrgMembers gets a permissions level (view | edit | manage | admin).
 *   - OrgFeaturedPubs loses dataAccess, and HubCommunities and HubOptOuts are dropped:
 *     ownership replaces curation and data access requests.
 *
 * Requires 2026_10_19_renameHubsToOrgs. down restores the schema, not the deleted orgs.
 */

const withTransaction = (sequelize, fn) =>
	sequelize.transaction(async (transaction) => {
		const run = (sql) => sequelize.query(sql, { transaction });
		const columnExists = async (table, column) => {
			const rows = await sequelize.query(
				`SELECT 1 FROM information_schema.columns
				 WHERE table_schema = current_schema() AND table_name = :table AND column_name = :column`,
				{ transaction, replacements: { table, column }, type: 'SELECT' },
			);
			return rows.length > 0;
		};
		return fn({ run, columnExists });
	});

export const up = async ({ sequelize }) => {
	await withTransaction(sequelize, async ({ run, columnExists }) => {
		await run(
			`UPDATE "CommunityTemplates" SET "isActive" = false
			 WHERE "orgId" IN (SELECT "id" FROM "Orgs" WHERE "kfOrgId" IS NULL)`,
		);
		// Cascades to OrgMembers, OrgFeaturedPubs, HubCommunities and HubOptOuts, and sets
		// Communities.orgId and CommunityTemplates.orgId to null
		await run('DELETE FROM "Orgs" WHERE "kfOrgId" IS NULL');
		await run('ALTER TABLE "Orgs" ALTER COLUMN "kfOrgId" SET NOT NULL');

		if (!(await columnExists('OrgMembers', 'permissions'))) {
			await run(
				`DO $$ BEGIN
					CREATE TYPE "enum_OrgMembers_permissions" AS ENUM ('view', 'edit', 'manage', 'admin');
				EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
			);
			await run(
				`ALTER TABLE "OrgMembers" ADD COLUMN "permissions" "enum_OrgMembers_permissions"
				 NOT NULL DEFAULT 'view'`,
			);
		}

		await run('ALTER TABLE "OrgFeaturedPubs" DROP COLUMN IF EXISTS "dataAccess"');
		await run('DROP TYPE IF EXISTS "enum_OrgFeaturedPubs_dataAccess"');
		await run('DROP TABLE IF EXISTS "HubCommunities"');
		await run('DROP TYPE IF EXISTS "enum_HubCommunities_dataAccess"');
		await run('DROP TABLE IF EXISTS "HubOptOuts"');
	});
};

export const down = async ({ sequelize }) => {
	await withTransaction(sequelize, async ({ run }) => {
		await run(
			`CREATE TABLE IF NOT EXISTS "HubOptOuts" (
				"id" UUID PRIMARY KEY,
				"communityId" UUID NOT NULL REFERENCES "Communities" ("id")
					ON DELETE CASCADE ON UPDATE CASCADE,
				"orgId" UUID NOT NULL REFERENCES "Orgs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
				"createdAt" TIMESTAMPTZ NOT NULL,
				"updatedAt" TIMESTAMPTZ NOT NULL
			)`,
		);
		await run(
			`DO $$ BEGIN
				CREATE TYPE "enum_HubCommunities_dataAccess" AS ENUM ('none', 'requested', 'granted');
			EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
		);
		await run(
			`CREATE TABLE IF NOT EXISTS "HubCommunities" (
				"id" UUID PRIMARY KEY,
				"orgId" UUID NOT NULL REFERENCES "Orgs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
				"communityId" UUID NOT NULL REFERENCES "Communities" ("id")
					ON DELETE CASCADE ON UPDATE CASCADE,
				"showOnLandingPage" BOOLEAN NOT NULL DEFAULT true,
				"dataAccess" "enum_HubCommunities_dataAccess" NOT NULL DEFAULT 'none',
				"createdAt" TIMESTAMPTZ NOT NULL,
				"updatedAt" TIMESTAMPTZ NOT NULL
			)`,
		);
		await run(
			`CREATE UNIQUE INDEX IF NOT EXISTS "HubCommunities_hubId_communityId_unique"
			 ON "HubCommunities" ("orgId", "communityId")`,
		);

		await run(
			`DO $$ BEGIN
				CREATE TYPE "enum_OrgFeaturedPubs_dataAccess" AS ENUM ('none', 'requested', 'granted');
			EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
		);
		await run(
			`ALTER TABLE "OrgFeaturedPubs" ADD COLUMN IF NOT EXISTS "dataAccess"
			 "enum_OrgFeaturedPubs_dataAccess" NOT NULL DEFAULT 'none'`,
		);

		await run('ALTER TABLE "OrgMembers" DROP COLUMN IF EXISTS "permissions"');
		await run('DROP TYPE IF EXISTS "enum_OrgMembers_permissions"');
		await run('ALTER TABLE "Orgs" ALTER COLUMN "kfOrgId" DROP NOT NULL');
	});
};
