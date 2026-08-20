-- The whole PubPub side of the Doily integration, in one transaction.
--
-- Squashes three migrations that were only ever going to be applied together:
--   2026_08_13_addDepositStateToCrossrefDepositRecords
--   2026_08_18_addDoilyOrgIdToCommunities
--   2026_08_20_renameDoilyProjectIdOnCommunities
-- The third only renamed a column the second had just added, so the net effect
-- is to add `doilyProjectId` under its real name and never mention the old one.
--
-- Every statement is idempotent, because the databases this runs against are in
-- three different states: local has the first two applied, dev and prod have
-- none, and re-running after a partial failure has to be safe. Applying it twice
-- changes nothing the second time.
--
-- Run it with psql, not through tools/migrate.js. That runner calls
-- sequelize.sync() before every migration, which creates indexes declared by
-- @Index decorators on the models: that is how the index on the old column ended
-- up named `communities_doily_org_id` rather than the name the 08_18 migration
-- asked for, and with the model now declaring `doilyProjectId`, sync would reach
-- for an index on a column that does not exist yet.

BEGIN;

-- --- Deposit state on CrossrefDepositRecords -------------------------------
--
-- All nullable, no default. A NULL status is meaningful: it marks a row that
-- predates deposit-state tracking, which the display rule in
-- utils/crossref/depositStatus.ts renders exactly as it always was. A default of
-- 'draft' or 'submitted' would quietly relabel every registered DOI in the
-- archive as unconfirmed.
ALTER TABLE "CrossrefDepositRecords" ADD COLUMN IF NOT EXISTS "status" text;
ALTER TABLE "CrossrefDepositRecords" ADD COLUMN IF NOT EXISTS "doilyDepositId" text;
ALTER TABLE "CrossrefDepositRecords" ADD COLUMN IF NOT EXISTS "doi" text;
ALTER TABLE "CrossrefDepositRecords" ADD COLUMN IF NOT EXISTS "error" text;
ALTER TABLE "CrossrefDepositRecords" ADD COLUMN IF NOT EXISTS "lastCheckedAt" timestamptz;

-- When the DOI first registered, straight from Doily's firstRegisteredAt.
-- Load-bearing rather than informational: deposit state is per attempt, so a
-- rejected UPDATE to an already-registered record reports status 'failed' while
-- doi.org keeps resolving it. Without this column the display rule would pull a
-- working DOI off pub pages and out of citations over stale metadata. See
-- isDoiPublic in utils/crossref/depositStatus.ts.
ALTER TABLE "CrossrefDepositRecords" ADD COLUMN IF NOT EXISTS "firstRegisteredAt" timestamptz;

-- Both are looked up by a webhook handler that runs once per deposit transition,
-- so the lookup has to be an index hit rather than a scan of every deposit
-- PubPub has ever made.
CREATE INDEX IF NOT EXISTS "crossref_deposit_records_doily_deposit_id_idx"
    ON "CrossrefDepositRecords" ("doilyDepositId");
CREATE INDEX IF NOT EXISTS "crossref_deposit_records_doi_idx"
    ON "CrossrefDepositRecords" ("doi");

-- --- The Doily project a community deposits under --------------------------
--
-- Caches the id Doily returns when the community is first provisioned. Doily's
-- provisioning is idempotent by slug, so this cache is what stops a second
-- provisioning call: null means "not resolved yet", never "not on Doily".
--
-- Three states to handle. A database that ran 08_18 has `doilyOrgId` and needs a
-- rename. One that ran nothing needs the column added. One that already has
-- `doilyProjectId` needs neither.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_name = 'Communities' AND column_name = 'doilyOrgId'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_name = 'Communities' AND column_name = 'doilyProjectId'
    ) THEN
        ALTER TABLE "Communities" RENAME COLUMN "doilyOrgId" TO "doilyProjectId";
    END IF;
END $$;

ALTER TABLE "Communities" ADD COLUMN IF NOT EXISTS "doilyProjectId" text;

-- The index is found by the column it covers, not by a name, because the name it
-- carries cannot be assumed: sequelize.sync() creates indexes from the @Index
-- decorators with its own generated names, so a database that has been synced
-- carries `communities_doily_org_id` while one migrated by 08_18 carries
-- `communities_doily_org_id_idx`.
DO $$
DECLARE existing text;
BEGIN
    SELECT indexname INTO existing
      FROM pg_indexes
     WHERE tablename = 'Communities'
       AND indexdef LIKE '%"doilyProjectId"%'
       AND indexname <> 'communities_doily_project_id_idx'
     LIMIT 1;
    IF existing IS NOT NULL THEN
        EXECUTE format('ALTER INDEX %I RENAME TO %I', existing, 'communities_doily_project_id_idx');
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "communities_doily_project_id_idx"
    ON "Communities" ("doilyProjectId");

COMMIT;
