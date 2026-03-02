/**
 * Firebase Path Migration Tool
 *
 * Migrates legacy `pub-{pubId}/branch-{branchId}` Firebase paths to the
 * modern `drafts/draft-{draftId}` format.
 *
 * What it does:
 * 1. Finds all Drafts with legacy paths in Postgres
 * 2. Copies all Firebase data from old path to new path
 * 3. Updates the Draft.firebasePath in Postgres
 * 4. Deletes the old Firebase path
 *
 * Safety:
 * - Dry run by default (use --execute to actually migrate)
 * - Single draft testing with --draftId=<uuid>
 * - Verifies data was copied before deleting old path
 *
 * Usage:
 *   pnpm run tools migrateFirebasePaths                    # Dry run, show what would change
 *   pnpm run tools migrateFirebasePaths --execute          # Actually migrate
 *   pnpm run tools migrateFirebasePaths --draftId=<uuid>   # Test single draft
 *
 * WARNING: Active editors on legacy paths will disconnect and need to refresh.
 */

import { Op } from 'sequelize';

import { Draft } from 'server/models';
import { sequelize } from 'server/sequelize';
import { getDatabaseRef } from 'server/utils/firebaseAdmin';

const {
	argv: { execute, draftId, verbose: verboseFlag },
} = require('yargs');

const isDryRun = !execute;
const isVerbose = verboseFlag;

// biome-ignore lint/suspicious/noConsole: CLI tool output
const log = (msg: string) => console.log(`[migrate] ${new Date().toISOString()} ${msg}`);
const verbose = (msg: string) => isVerbose && log(msg);

interface MigrationStats {
	found: number;
	migrated: number;
	skipped: number;
	failed: number;
}

const stats: MigrationStats = {
	found: 0,
	migrated: 0,
	skipped: 0,
	failed: 0,
};

/**
 * Check if a path is in legacy format
 */
const isLegacyPath = (path: string): boolean => {
	return /^pub-[^/]+\/branch-[^/]+$/.test(path);
};

/**
 * Generate the modern path for a draft
 */
const getModernPath = (draftId: string): string => {
	return `drafts/draft-${draftId}`;
};

/**
 * Copy all data from one Firebase path to another
 */
const copyFirebaseData = async (sourcePath: string, destPath: string): Promise<boolean> => {
	const sourceRef = getDatabaseRef(sourcePath);
	const destRef = getDatabaseRef(destPath);

	// Get all data from source
	const snapshot = await sourceRef.once('value');
	const data = snapshot.val();

	if (!data) {
		verbose(`  No data found at ${sourcePath}`);
		return false;
	}

	// Write to destination
	await destRef.set(data);

	// Verify the copy
	const verifySnapshot = await destRef.once('value');
	const verifyData = verifySnapshot.val();

	if (!verifyData) {
		throw new Error(`Verification failed: no data at destination ${destPath}`);
	}

	// Basic verification: check that key counts match
	const sourceKeys = Object.keys(data);
	const destKeys = Object.keys(verifyData);

	if (sourceKeys.length !== destKeys.length) {
		throw new Error(
			`Verification failed: key count mismatch (${sourceKeys.length} vs ${destKeys.length})`,
		);
	}

	return true;
};

/**
 * Migrate a single draft from legacy to modern path
 */
const migrateDraft = async (draft: Draft): Promise<boolean> => {
	const { id, firebasePath } = draft;
	const modernPath = getModernPath(id);

	log(`  Migrating draft ${id}`);
	verbose(`    From: ${firebasePath}`);
	verbose(`    To:   ${modernPath}`);

	if (isDryRun) {
		log(`  [DRY RUN] Would migrate ${firebasePath} -> ${modernPath}`);
		return true;
	}

	try {
		// Step 1: Copy data to new path
		const hasData = await copyFirebaseData(firebasePath, modernPath);
		if (!hasData) {
			log(`  Skipping ${id}: no Firebase data found`);
			stats.skipped++;
			return false;
		}
		verbose(`    Copied Firebase data`);

		// Step 2: Update Postgres
		await draft.update({ firebasePath: modernPath });
		verbose(`    Updated Postgres`);

		// Step 3: Delete old path
		await getDatabaseRef(firebasePath).remove();
		verbose(`    Deleted old path`);

		stats.migrated++;
		log(`  Successfully migrated draft ${id}`);
		return true;
	} catch (error: any) {
		log(`  ERROR migrating draft ${id}: ${error.message}`);
		stats.failed++;
		return false;
	}
};

/**
 * Main migration function
 */
const main = async () => {
	log('='.repeat(60));
	log('Firebase Path Migration Tool');
	log(`Mode: ${isDryRun ? 'DRY RUN' : 'EXECUTE'}`);
	log('='.repeat(60));

	try {
		await sequelize.authenticate();
		log('Connected to database');

		// Find drafts with legacy paths
		const whereClause: any = {
			firebasePath: {
				[Op.like]: 'pub-%',
			},
		};

		if (draftId) {
			whereClause.id = draftId;
		}

		const drafts = await Draft.findAll({
			where: whereClause,
			order: [['id', 'ASC']],
		});

		stats.found = drafts.length;
		log(`Found ${drafts.length} drafts with legacy paths`);

		if (drafts.length === 0) {
			log('Nothing to migrate');
			return;
		}

		// Show sample if not verbose
		if (!isVerbose && drafts.length > 5) {
			log('Sample of paths to migrate:');
			for (let i = 0; i < Math.min(5, drafts.length); i++) {
				const d = drafts[i];
				log(`  ${d.id}: ${d.firebasePath} -> ${getModernPath(d.id)}`);
			}
			log(`  ... and ${drafts.length - 5} more`);
		}

		// Process drafts
		for (const draft of drafts) {
			if (!isLegacyPath(draft.firebasePath)) {
				verbose(`  Skipping ${draft.id}: not a legacy path (${draft.firebasePath})`);
				stats.skipped++;
				continue;
			}

			// biome-ignore lint/performance/noAwaitInLoops: sequential for safety
			await migrateDraft(draft);
		}

		log('');
		log('='.repeat(60));
		log('Migration Summary');
		log('='.repeat(60));
		log(`  Found:    ${stats.found}`);
		log(`  Migrated: ${stats.migrated}`);
		log(`  Skipped:  ${stats.skipped}`);
		log(`  Failed:   ${stats.failed}`);

		if (isDryRun) {
			log('');
			log('This was a DRY RUN. Use --execute to actually migrate.');
		}
	} catch (error: any) {
		log(`Fatal error: ${error.message}`);
		console.error(error);
		process.exit(1);
	} finally {
		await sequelize.close();
	}
};

main();
