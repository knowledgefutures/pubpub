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
	if (upserts.length > 0) {
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
	}

	// Retention: remove cache rows for pubs that no longer exist in this push.
	await UnderlayPushEntry.destroy({
		where: {
			underlayIntegrationId,
			...(presentPubIds.length > 0 ? { pubId: { [Op.notIn]: presentPubIds } } : {}),
		},
	});
};
