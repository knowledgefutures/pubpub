/**
 * Postgres triggers and functions for maintaining pre-computed tsvector columns
 * on the Pubs and Communities tables. These are installed after sequelize.sync()
 * so the columns/indexes exist before the triggers reference them.
 *
 * Weight mapping for Pubs:
 *   A = title
 *   B = description
 *   C = byline (aggregated from PubAttributions + Users)
 *   D = latest release doc content (extracted from ProseMirror JSON)
 *
 * Weight mapping for Communities:
 *   A = title
 *   B = description
 *
 * Triggers fire on:
 *   - Pubs INSERT/UPDATE of title or description
 *   - PubAttributions INSERT/UPDATE/DELETE (recalculates byline for affected pub)
 *   - Releases INSERT (new release = new doc content for the pub)
 *   - Communities INSERT/UPDATE of title or description
 */

import { sequelize } from 'server/sequelize';

/**
 * Advisory lock key for search DDL installation. Prevents "tuple concurrently
 * updated" errors when multiple processes race to CREATE OR REPLACE the same
 * functions/triggers at startup.
 */
const INSTALL_LOCK_KEY = 839272;

/**
 * Install all search-related triggers and functions. Idempotent — uses
 * CREATE OR REPLACE and IF NOT EXISTS throughout. Serialized across
 * concurrent processes via an advisory lock to avoid catalog conflicts.
 */
export const installSearchTriggers = async () => {
	await sequelize.transaction(async (transaction) => {
		// Serialize DDL across all connections — blocks until the lock is available.
		await sequelize.query(`SELECT pg_advisory_xact_lock(:key)`, {
			replacements: { key: INSTALL_LOCK_KEY },
			transaction,
		});

		// ---- Ensure searchVector columns exist (sync force:false won't add them) ----
		await sequelize.query(
			`ALTER TABLE "Pubs" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;`,
			{ transaction },
		);
		await sequelize.query(
			`ALTER TABLE "Communities" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;`,
			{ transaction },
		);

		// ---- GIN indexes on searchVector columns ----
		await sequelize.query(
			`
			CREATE INDEX IF NOT EXISTS pubs_search_vector_idx
			ON "Pubs" USING gin ("searchVector");
		`,
			{ transaction },
		);
		await sequelize.query(
			`
			CREATE INDEX IF NOT EXISTS communities_search_vector_idx
			ON "Communities" USING gin ("searchVector");
		`,
			{ transaction },
		);

		// ---- Helper: extract plain text from ProseMirror JSONB ----
		await sequelize.query(
			`
			CREATE OR REPLACE FUNCTION extract_doc_text(doc_content jsonb)
			RETURNS text
			LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
				WITH RECURSIVE nodes(node) AS (
					SELECT doc_content
					UNION ALL
					SELECT jsonb_array_elements(nodes.node->'content')
					FROM nodes
					WHERE nodes.node->'content' IS NOT NULL
					  AND jsonb_typeof(nodes.node->'content') = 'array'
				)
				SELECT coalesce(string_agg(node->>'text', ' '), '')
				FROM nodes
				WHERE node->>'text' IS NOT NULL;
			$$;
		`,
			{ transaction },
		);

		// ---- Pub search vector update function ----
		await sequelize.query(
			`
			CREATE OR REPLACE FUNCTION pub_search_vector_update()
			RETURNS trigger
			LANGUAGE plpgsql AS $$
			DECLARE
				target_pub_id uuid;
				pub_title text;
				pub_description text;
				byline_text text;
				doc_text text;
				doc_id uuid;
			BEGIN
				-- Determine which pub to update
				IF TG_TABLE_NAME = 'Pubs' THEN
					target_pub_id := NEW.id;
				ELSIF TG_TABLE_NAME = 'PubAttributions' THEN
					IF TG_OP = 'DELETE' THEN
						target_pub_id := OLD."pubId";
					ELSE
						target_pub_id := NEW."pubId";
					END IF;
				ELSIF TG_TABLE_NAME = 'Releases' THEN
					target_pub_id := NEW."pubId";
				END IF;

				-- Get the pub's title and description
				SELECT p.title, p.description INTO pub_title, pub_description
				FROM "Pubs" p WHERE p.id = target_pub_id;
				IF NOT FOUND THEN
					RETURN COALESCE(NEW, OLD);
				END IF;

				-- Aggregate byline from PubAttributions + Users
				SELECT coalesce(string_agg(coalesce(u."fullName", pa.name), ' '), '')
				INTO byline_text
				FROM "PubAttributions" pa
				LEFT JOIN "Users" u ON u.id = pa."userId"
				WHERE pa."pubId" = target_pub_id
				  AND pa."isAuthor" = true
				  AND (pa.name IS NOT NULL OR u."fullName" IS NOT NULL);

				-- Get latest release doc content
				SELECT r."docId" INTO doc_id
				FROM "Releases" r
				WHERE r."pubId" = target_pub_id
				ORDER BY r."createdAt" DESC
				LIMIT 1;

				IF doc_id IS NOT NULL THEN
					SELECT extract_doc_text(d.content) INTO doc_text
					FROM "Docs" d WHERE d.id = doc_id;
				END IF;

				-- Update the search vector
				UPDATE "Pubs" SET "searchVector" =
					setweight(to_tsvector('english', coalesce(pub_title, '')), 'A') ||
					setweight(to_tsvector('english', coalesce(pub_description, '')), 'B') ||
					setweight(to_tsvector('english', coalesce(byline_text, '')), 'C') ||
					setweight(to_tsvector('english', coalesce(doc_text, '')), 'D')
				WHERE id = target_pub_id;

				RETURN COALESCE(NEW, OLD);
			END;
			$$;
		`,
			{ transaction },
		);

		// ---- Triggers on Pubs ----
		await sequelize.query(
			`
			DROP TRIGGER IF EXISTS pubs_search_vector_update ON "Pubs";
			CREATE TRIGGER pubs_search_vector_update
			AFTER INSERT OR UPDATE OF title, description ON "Pubs"
			FOR EACH ROW
			EXECUTE FUNCTION pub_search_vector_update();
		`,
			{ transaction },
		);

		// ---- Triggers on PubAttributions ----
		await sequelize.query(
			`
			DROP TRIGGER IF EXISTS pubattributions_search_vector_update ON "PubAttributions";
			CREATE TRIGGER pubattributions_search_vector_update
			AFTER INSERT OR UPDATE OR DELETE ON "PubAttributions"
			FOR EACH ROW
			EXECUTE FUNCTION pub_search_vector_update();
		`,
			{ transaction },
		);

		// ---- Triggers on Releases ----
		await sequelize.query(
			`
			DROP TRIGGER IF EXISTS releases_search_vector_update ON "Releases";
			CREATE TRIGGER releases_search_vector_update
			AFTER INSERT ON "Releases"
			FOR EACH ROW
			EXECUTE FUNCTION pub_search_vector_update();
		`,
			{ transaction },
		);

		// ---- Community search vector update function ----
		await sequelize.query(
			`
			CREATE OR REPLACE FUNCTION community_search_vector_update()
			RETURNS trigger
			LANGUAGE plpgsql AS $$
			BEGIN
				NEW."searchVector" :=
					setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
					setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B');
				RETURN NEW;
			END;
			$$;
		`,
			{ transaction },
		);

		// ---- Trigger on Communities (BEFORE so we can modify NEW directly) ----
		await sequelize.query(
			`
			DROP TRIGGER IF EXISTS communities_search_vector_update ON "Communities";
			CREATE TRIGGER communities_search_vector_update
			BEFORE INSERT OR UPDATE OF title, description ON "Communities"
			FOR EACH ROW
			EXECUTE FUNCTION community_search_vector_update();
		`,
			{ transaction },
		);
	});
};

const BATCH_SIZE = 500;
const BATCH_DELAY_MS = 200;

/**
 * Advisory lock key for search vector backfill. Only one process across all
 * dynos/containers will hold this lock at a time; others skip the backfill.
 * The number is arbitrary but must be consistent.
 */
const BACKFILL_LOCK_KEY = 839271;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Run a callback while holding a Postgres advisory lock. Uses a dedicated
 * transaction so the lock is held on a single connection for its full
 * duration and automatically released when the transaction commits/rolls back.
 * Returns false (and skips the callback) if another session already holds it.
 */
const withBackfillLock = async (fn: () => Promise<void>): Promise<boolean> => {
	return sequelize.transaction(async (transaction) => {
		const [rows] = await sequelize.query(`SELECT pg_try_advisory_xact_lock(:key) AS locked`, {
			replacements: { key: BACKFILL_LOCK_KEY },
			transaction,
		});
		const acquired = (rows as any)[0]?.locked === true;
		if (!acquired) {
			console.log('[search backfill] Another process already holds the lock, skipping');
			return false;
		}
		await fn();
		return true;
	});
};

/**
 * Run a batched UPDATE that processes BATCH_SIZE rows at a time with a short
 * sleep between batches. Returns total rows updated. The query MUST include
 * a LIMIT clause referencing :batchSize so each iteration is bounded.
 * Caps at MAX_BATCHES iterations as a safety net against infinite loops.
 */
const MAX_BATCHES = 10_000; // 10k × 500 = 5M rows max

const batchedUpdate = async (label: string, sql: string): Promise<number> => {
	let totalUpdated = 0;
	for (let i = 0; i < MAX_BATCHES; i++) {
		// biome-ignore lint/performance/noAwaitInLoops: intentionally sequential batching
		const [, rowCount] = await sequelize.query(sql, {
			replacements: { batchSize: BATCH_SIZE },
		});
		const affected =
			typeof rowCount === 'number' ? rowCount : ((rowCount as any)?.rowCount ?? 0);
		if (affected === 0) break;
		totalUpdated += affected;
		console.log(`[search backfill] ${label}: ${totalUpdated} rows so far`);
		if (i === MAX_BATCHES - 1) {
			console.error(
				`[search backfill] ${label}: hit MAX_BATCHES limit (${MAX_BATCHES}), stopping`,
			);
		}
		await sleep(BATCH_DELAY_MS);
	}
	return totalUpdated;
};

/**
 * Backfill searchVector for all existing Pubs that have NULL searchVector.
 * Processes in small batches to avoid locking the table or saturating the
 * connection pool. Uses a Postgres advisory lock so only one process (across
 * all dynos) runs the backfill; the rest skip it.
 */
export const backfillPubSearchVectors = async () => {
	await withBackfillLock(async () => {
		// Step 1: Set all 4 weights in one pass for pubs with NULL searchVector.
		// This avoids the previous multi-step approach where Steps 2/3 could
		// re-process already-backfilled rows. Each batch computes the full
		// vector (title + description + byline + doc content) atomically.
		const total = await batchedUpdate(
			'pubs full vector',
			`UPDATE "Pubs" p SET "searchVector" =
				setweight(to_tsvector('english', coalesce(p.title, '')), 'A') ||
				setweight(to_tsvector('english', coalesce(p.description, '')), 'B') ||
				setweight(to_tsvector('english', coalesce(byline_sub.byline_text, '')), 'C') ||
				setweight(to_tsvector('english', coalesce(doc_sub.doc_text, '')), 'D')
			FROM (
				SELECT id AS pub_id FROM "Pubs"
				WHERE "searchVector" IS NULL
				LIMIT :batchSize
			) batch
			LEFT JOIN LATERAL (
				SELECT string_agg(coalesce(u."fullName", pa.name), ' ') AS byline_text
				FROM "PubAttributions" pa
				LEFT JOIN "Users" u ON u.id = pa."userId"
				WHERE pa."pubId" = batch.pub_id
				  AND pa."isAuthor" = true
				  AND (pa.name IS NOT NULL OR u."fullName" IS NOT NULL)
			) byline_sub ON true
			LEFT JOIN LATERAL (
				SELECT extract_doc_text(d.content) AS doc_text
				FROM "Releases" r
				JOIN "Docs" d ON d.id = r."docId"
				WHERE r."pubId" = batch.pub_id
				ORDER BY r."createdAt" DESC
				LIMIT 1
			) doc_sub ON true
			WHERE p.id = batch.pub_id`,
		);

		console.log(`[search backfill] Pubs complete: ${total} rows`);
	});
};

/**
 * Backfill searchVector for all existing Communities with NULL searchVector.
 * Batched to avoid blocking other queries. Skips if another process is
 * already running a backfill (shares the same advisory lock).
 */
export const backfillCommunitySearchVectors = async () => {
	await withBackfillLock(async () => {
		const total = await batchedUpdate(
			'communities',
			`UPDATE "Communities" SET "searchVector" =
				setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
				setweight(to_tsvector('english', coalesce(description, '')), 'B')
			WHERE id IN (
				SELECT id FROM "Communities" WHERE "searchVector" IS NULL LIMIT :batchSize
			)`,
		);
		console.log(`[search backfill] Communities complete: ${total} rows`);
	});
};
