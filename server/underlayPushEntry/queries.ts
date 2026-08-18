import type { CachedPubEntry } from '../underlay/incremental';

import { Op } from 'sequelize';

import { UnderlayPushEntry } from 'server/models';

/** Load the push cache for an integration as the plain shape the incremental builder consumes. */
export const getPushCacheEntries = async (
	underlayIntegrationId: string,
): Promise<CachedPubEntry[]> => {
	const rows = await UnderlayPushEntry.findAll({ where: { underlayIntegrationId } });
	return rows.map((row) => ({
		pubId: row.pubId,
		recordHashes: row.recordHashes,
		fileHashes: row.fileHashes ?? [],
		latestReleaseHistoryKey: row.latestReleaseHistoryKey,
		pubUpdatedAt: row.pubUpdatedAt,
		optionsSignature: row.optionsSignature,
		facetsSignature: row.facetsSignature ?? '',
	}));
};

/**
 * Upsert cache entries for pubs that have been fully mapped AND whose files are already uploaded.
 *
 * Split out of `applyPushCache` so it can also be called DURING a push, not just after a successful
 * commit. Entries are pure functions of the pub's inputs (updatedAt, latest release, options,
 * facets), so writing one early is not a claim that the push succeeded — only that this pub's
 * records and file hashes have been computed and its bytes handed to Underlay. That makes a
 * retry after a failed or timed-out push resume instead of restarting: the pub becomes a cache hit,
 * skipping both its re-render and its re-upload. If the server later turns out to lack one of those
 * files, negotiate reports it in `needed_files` and `resolveFileByHash` re-maps the pub on demand.
 */
export const upsertPushCacheEntries = async (
	underlayIntegrationId: string,
	upserts: CachedPubEntry[],
): Promise<void> => {
	if (upserts.length === 0) {
		return;
	}
	await UnderlayPushEntry.bulkCreate(
		upserts.map((entry) => ({
			underlayIntegrationId,
			pubId: entry.pubId,
			recordHashes: entry.recordHashes,
			fileHashes: entry.fileHashes,
			latestReleaseHistoryKey: entry.latestReleaseHistoryKey,
			pubUpdatedAt: new Date(entry.pubUpdatedAt),
			optionsSignature: entry.optionsSignature,
			facetsSignature: entry.facetsSignature,
		})),
		{
			// Explicit ON CONFLICT target. Without this, Sequelize derives the conflict keys
			// from the model's unique indexes, whose fields sequelize-typescript stores as
			// objects — which crashes quoteIdentifier ("s.replace is not a function").
			conflictAttributes: ['underlayIntegrationId', 'pubId'],
			updateOnDuplicate: [
				'recordHashes',
				'fileHashes',
				'latestReleaseHistoryKey',
				'pubUpdatedAt',
				'optionsSignature',
				'facetsSignature',
			],
		},
	);
};

/**
 * Persist the push cache after a SUCCESSFUL commit: upsert the changed pubs' entries and drop
 * entries for pubs no longer present. The delete pass is what must wait for success.
 */
export const applyPushCache = async (
	underlayIntegrationId: string,
	upserts: CachedPubEntry[],
	presentPubIds: string[],
): Promise<void> => {
	await upsertPushCacheEntries(underlayIntegrationId, upserts);

	// Retention: remove cache rows for pubs that no longer exist in this push.
	await UnderlayPushEntry.destroy({
		where: {
			underlayIntegrationId,
			...(presentPubIds.length > 0 ? { pubId: { [Op.notIn]: presentPubIds } } : {}),
		},
	});
};
