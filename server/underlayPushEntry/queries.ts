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
 * Persist the push cache after a SUCCESSFUL commit: upsert the changed pubs' entries and drop
 * entries for pubs no longer present. Call this only on success so a failed push never poisons the
 * cache.
 */
export const applyPushCache = async (
	underlayIntegrationId: string,
	upserts: CachedPubEntry[],
	presentPubIds: string[],
): Promise<void> => {
	for (const entry of upserts) {
		// biome-ignore lint/performance/noAwaitInLoops: cache rows written sequentially, bounded by changed pubs
		const existing = await UnderlayPushEntry.findOne({
			where: { underlayIntegrationId, pubId: entry.pubId },
		});
		const values = {
			underlayIntegrationId,
			pubId: entry.pubId,
			recordHashes: entry.recordHashes,
			fileHashes: entry.fileHashes,
			latestReleaseHistoryKey: entry.latestReleaseHistoryKey,
			pubUpdatedAt: new Date(entry.pubUpdatedAt),
			optionsSignature: entry.optionsSignature,
			facetsSignature: entry.facetsSignature,
		};
		if (existing) {
			// biome-ignore lint/performance/noAwaitInLoops: sequential upsert, bounded by changed pubs
			await existing.update(values);
		} else {
			// biome-ignore lint/performance/noAwaitInLoops: sequential upsert, bounded by changed pubs
			await UnderlayPushEntry.create(values);
		}
	}

	// Retention: remove cache rows for pubs that no longer exist in this push.
	await UnderlayPushEntry.destroy({
		where: {
			underlayIntegrationId,
			...(presentPubIds.length > 0 ? { pubId: { [Op.notIn]: presentPubIds } } : {}),
		},
	});
};
