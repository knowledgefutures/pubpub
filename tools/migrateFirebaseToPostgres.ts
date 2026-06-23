/**
 * Migration Tool: Firebase -> Postgres Collab
 *
 * Migrates all active drafts from Firebase to the new Pitter Patter Collab
 * data model in Postgres. For each draft:
 *
 * 1. Ensures a DraftCheckpoint exists (runs cold storage if needed)
 * 2. Extracts any Firebase changes after the checkpoint
 * 3. Inserts those changes into the CollabCommits table
 * 4. Sets Draft.version to the latest commit version
 *
 * This script is safe to run repeatedly -- drafts that already have commits
 * in Postgres are skipped.
 *
 * Usage:
 *   pnpm run tools migrateFirebaseToPostgres                   # Dry run
 *   pnpm run tools migrateFirebaseToPostgres --execute         # Actually migrate
 *   pnpm run tools migrateFirebaseToPostgres --pubId=<uuid>    # Single pub
 *   pnpm run tools migrateFirebaseToPostgres --batchSize=100   # Custom batch size
 *   pnpm run tools migrateFirebaseToPostgres --concurrency=20  # Parallel drafts
 *   pnpm run tools migrateFirebaseToPostgres --verbose         # Verbose output
 */

import firebaseAdmin from 'firebase-admin';
import { uncompressStepJSON } from 'prosemirror-compress-pubpub';
import { Op, QueryTypes } from 'sequelize';
import { v4 as uuid } from 'uuid';

import { editorSchema, getFirebaseDoc } from 'components/Editor';
import { getDraftCheckpoint, upsertDraftCheckpoint } from 'server/draftCheckpoint/queries';
import { CollabCommit, Draft, Pub } from 'server/models';
import { sequelize } from 'server/sequelize';
import { getFirebaseConfig } from 'utils/editor/firebaseConfig';

const {
	argv: {
		execute,
		pubId: specificPubId,
		batchSize: batchSizeArg = 50,
		concurrency: concurrencyArg = 20,
		verbose: verboseFlag,
	},
} = require('yargs');

const isDryRun = !execute;
const BATCH_SIZE = Number(batchSizeArg);
const CONCURRENCY = Number(concurrencyArg);

const runWithConcurrency = async (tasks: (() => Promise<void>)[], limit: number) => {
	let i = 0;

	const run = async () => {
		while (i < tasks.length) {
			const idx = i++;
			// biome-ignore lint/performance/noAwaitInLoops: concurrency pool worker
			await tasks[idx]();
		}
	};

	const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => run());
	await Promise.all(workers);
};

const log = (msg: string) => console.log(`[migrate] ${new Date().toISOString()} ${msg}`);
const verbose = (msg: string) => verboseFlag && log(msg);

const formatDuration = (ms: number) => {
	if (ms < 1000) return `${ms}ms`;
	if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
	return `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;
};

const getFirebaseApp = () => {
	if (firebaseAdmin.apps.length > 0) {
		return firebaseAdmin.apps[0]!;
	}

	const serviceAccount = JSON.parse(
		Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 as string, 'base64').toString(),
	);

	return firebaseAdmin.initializeApp({
		credential: firebaseAdmin.credential.cert(serviceAccount),
		databaseURL: getFirebaseConfig().databaseURL,
	});
};

const getTotalDraftCount = async (): Promise<number> => {
	if (specificPubId) {
		return 1;
	}

	const [result] = await sequelize.query<{ count: string }>(
		`SELECT COUNT(*) as count FROM "Drafts" WHERE "firebasePath" IS NOT NULL`,
		{ type: QueryTypes.SELECT },
	);

	return parseInt(result.count, 10);
};

const getDraftBatch = async (offset: number): Promise<Draft[]> => {
	if (specificPubId) {
		const pub = await Pub.findOne({
			where: { id: specificPubId },
			include: [{ model: Draft, as: 'draft' }],
		});

		if (!pub?.draft) {
			throw new Error(`Pub ${specificPubId} not found or has no draft`);
		}

		return [pub.draft];
	}

	return Draft.findAll({
		where: {
			firebasePath: { [Op.ne]: null },
		},
		order: [['createdAt', 'ASC']],
		limit: BATCH_SIZE,
		offset,
	});
};

const migrateDraft = async (draft: Draft, firebaseApp: firebaseAdmin.app.App) => {
	const draftId = draft.id;
	const firebasePath = draft.firebasePath;

	if (!firebasePath) {
		return { skipped: true };
	}

	const database = firebaseApp.database();
	const ref = database.ref(firebasePath) as any;

	let checkpoint = await getDraftCheckpoint(draftId);

	if (!checkpoint) {
		verbose(`  [${draftId.slice(0, 8)}] building checkpoint from Firebase...`);

		try {
			const { doc, key: currentKey } = await getFirebaseDoc(ref, editorSchema);

			if (currentKey < 0) {
				verbose(`  [${draftId.slice(0, 8)}] empty Firebase, skipping`);
				return { skipped: true };
			}

			if (!isDryRun) {
				checkpoint = await upsertDraftCheckpoint(
					draftId,
					currentKey,
					doc.toJSON() as any,
					Date.now(),
				);
			}
		} catch (err) {
			log(`  [${draftId.slice(0, 8)}] ERROR building checkpoint: ${err}`);
			return { error: true };
		}
	}

	if (!checkpoint && isDryRun) {
		return { wouldMigrate: true };
	}

	if (!checkpoint) {
		return { error: true };
	}

	const checkpointKey = checkpoint.historyKey;

	try {
		const [changesSnapshot, mergesSnapshot] = await Promise.all([
			ref.child('changes').orderByKey().startAt(String(checkpointKey + 1)).once('value'),
			ref.child('merges').orderByKey().startAt(String(checkpointKey + 1)).once('value'),
		]);

		const allKeyables = {
			...(changesSnapshot.val() || {}),
			...(mergesSnapshot.val() || {}),
		};

		const keys = Object.keys(allKeyables).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

		if (keys.length === 0) {
			if (!isDryRun) {
				await Draft.update({ version: checkpointKey }, { where: { id: draftId } });
			}

			return { migrated: true, commits: 0 };
		}

		if (isDryRun) {
			log(`  [${draftId.slice(0, 8)}] would migrate ${keys.length} change(s)`);
			return { wouldMigrate: true, commits: keys.length };
		}

		const rows: { draftId: string; version: number; ref: string; steps: any[] }[] = [];

		for (const key of keys) {
			const keyNum = parseInt(key, 10);
			const changeData = allKeyables[key];
			const changes = Array.isArray(changeData) ? changeData : [changeData];

			for (const change of changes) {
				const stepsJson = change.s.map((compressed: any) =>
					uncompressStepJSON(compressed),
				);

				rows.push({ draftId, version: keyNum, ref: uuid(), steps: stepsJson });
			}
		}

		await sequelize.transaction(async (txn) => {
			await CollabCommit.bulkCreate(rows, { transaction: txn });

			const latestVersion = parseInt(keys[keys.length - 1], 10);
			await Draft.update(
				{ version: latestVersion },
				{ where: { id: draftId }, transaction: txn },
			);
		});

		verbose(`  [${draftId.slice(0, 8)}] migrated ${keys.length} commit(s)`);
		return { migrated: true, commits: keys.length };
	} catch (err) {
		log(`  [${draftId.slice(0, 8)}] ERROR: ${err}`);
		return { error: true };
	}
};

const main = async () => {
	const startTime = Date.now();

	log(isDryRun ? 'DRY RUN (pass --execute to apply)' : 'EXECUTING migration');
	log(`Batch size: ${BATCH_SIZE}, concurrency: ${CONCURRENCY}`);

	const firebaseApp = getFirebaseApp();
	const totalDrafts = await getTotalDraftCount();

	log(`Total drafts with firebasePath: ${totalDrafts}`);

	let migrated = 0;
	let skipped = 0;
	let errors = 0;
	let totalCommits = 0;
	let processed = 0;
	let offset = 0;

	while (true) {
		// biome-ignore lint/performance/noAwaitInLoops: outer batch loop
		const batch = await getDraftBatch(offset);

		if (batch.length === 0) {
			break;
		}

		const batchNum = Math.floor(offset / BATCH_SIZE) + 1;
		const totalBatches = Math.ceil(totalDrafts / BATCH_SIZE);
		log(
			`Processing batch ${batchNum}/${totalBatches} (${batch.length} drafts, offset ${offset})`,
		);

		// pre-filter: find which drafts in this batch already have commits
		const batchIds = batch.map((d) => d.id);

		const alreadyMigrated = await sequelize.query<{ draftId: string }>(
			`SELECT DISTINCT "draftId" FROM "CollabCommits" WHERE "draftId" IN (:ids)`,
			{ replacements: { ids: batchIds }, type: QueryTypes.SELECT },
		);

		const migratedSet = new Set(alreadyMigrated.map((r) => r.draftId));
		const toMigrate = batch.filter((d) => !migratedSet.has(d.id));
		const batchSkipped = batch.length - toMigrate.length;

		skipped += batchSkipped;
		processed += batchSkipped;

		if (batchSkipped > 0) {
			verbose(`  Skipped ${batchSkipped} already-migrated drafts`);
		}

		await runWithConcurrency(
			toMigrate.map(
				(draft) => async () => {
					const result = await migrateDraft(draft, firebaseApp);

					if (result.skipped) {
						skipped++;
					} else if (result.error) {
						errors++;
					} else {
						migrated++;
						totalCommits += (result as any).commits ?? 0;
					}

					processed++;

					if (processed % 100 === 0) {
						const elapsed = Date.now() - startTime;
						const rate = processed / (elapsed / 1000);
						const remaining = totalDrafts - processed;
						const eta = remaining / rate;

						log(
							`  Progress: ${processed}/${totalDrafts} (${Math.round((processed / totalDrafts) * 100)}%) ` +
								`| migrated=${migrated} skipped=${skipped} errors=${errors} ` +
								`| ${rate.toFixed(1)} drafts/sec, ETA ${formatDuration(eta * 1000)}`,
						);
					}
				},
			),
			CONCURRENCY,
		);

		offset += batch.length;

		if (specificPubId) {
			break;
		}
	}

	const elapsed = Date.now() - startTime;
	log('');
	log(`Finished in ${formatDuration(elapsed)}`);
	log(`  Processed: ${processed}`);
	log(`  Migrated:  ${migrated} (${totalCommits} total commits)`);
	log(`  Skipped:   ${skipped}`);
	log(`  Errors:    ${errors}`);

	process.exit(errors > 0 ? 1 : 0);
};

main().catch((err) => {
	console.error('Fatal error:', err);
	process.exit(1);
});
