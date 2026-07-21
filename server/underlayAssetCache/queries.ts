import { UnderlayAssetCache } from 'server/models';

/** Cached asset metadata (as consumed by the mapping's asset localizer). */
export type CachedAssetRow = { hash: string; mimeType?: string; fileName?: string };

/** Load the cached hash for each of the given asset URLs (missing URLs are simply absent). */
export const getCachedAssetHashes = async (
	urls: string[],
): Promise<Map<string, CachedAssetRow>> => {
	const out = new Map<string, CachedAssetRow>();
	if (urls.length === 0) {
		return out;
	}
	const rows = await UnderlayAssetCache.findAll({ where: { url: urls } });
	for (const row of rows) {
		out.set(row.url, {
			hash: row.hash,
			mimeType: row.mimeType ?? undefined,
			fileName: row.fileName ?? undefined,
		});
	}
	return out;
};

/**
 * Persist newly-fetched url → hash mappings. Safe to call with entries that already exist: URLs are
 * immutable, so a conflict on the unique `url` is ignored (ON CONFLICT DO NOTHING). Call only after a
 * successful commit so the cache never records a hash whose bytes never reached Underlay.
 */
export const saveCachedAssetHashes = async (
	entries: { url: string; hash: string; mimeType?: string; fileName?: string }[],
): Promise<void> => {
	if (entries.length === 0) {
		return;
	}
	await UnderlayAssetCache.bulkCreate(
		entries.map((e) => ({
			url: e.url,
			hash: e.hash,
			mimeType: e.mimeType ?? null,
			fileName: e.fileName ?? null,
		})),
		{ ignoreDuplicates: true },
	);
};
