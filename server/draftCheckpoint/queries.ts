import type { DocJson } from 'types';

import { DraftCheckpoint } from 'server/models';

/**
 * Create or update the checkpoint for a draft.
 * Each draft has at most one checkpoint — an upsert on draftId.
 */
export const upsertDraftCheckpoint = async (
	draftId: string,
	historyKey: number,
	doc: DocJson,
	timestamp: number | null = null,
	sequelizeTransaction: any = null,
	options: {
		discussions?: Record<string, any> | null;
		stepMaps?: number[][] | null;
		stepMapToKey?: number | null;
	} = {},
) => {
	// Only include optional fields in the update if they were explicitly provided.
	// This prevents normal checkpoint writes (from the client API) from clobbering
	// stepMaps/discussions that were set during cold storage.
	const optionalFields: Partial<
		Pick<DraftCheckpoint, 'discussions' | 'stepMaps' | 'stepMapToKey'>
	> = {};
	if ('discussions' in options) optionalFields.discussions = options.discussions ?? null;
	if ('stepMaps' in options) optionalFields.stepMaps = options.stepMaps ?? null;
	if ('stepMapToKey' in options) optionalFields.stepMapToKey = options.stepMapToKey ?? null;

	const existing = await DraftCheckpoint.findOne({
		where: { draftId },
		transaction: sequelizeTransaction,
	});

	if (existing) {
		// Only update if the new key is more recent
		if (historyKey > existing.historyKey) {
			await existing.update(
				{ historyKey, doc, timestamp, ...optionalFields },
				{ transaction: sequelizeTransaction },
			);
		}
		return existing;
	}

	return DraftCheckpoint.create(
		{ draftId, historyKey, doc, timestamp, ...optionalFields },
		{ transaction: sequelizeTransaction },
	);
};

/**
 * Get the checkpoint for a draft, if one exists.
 */
export const getDraftCheckpoint = async (draftId: string, sequelizeTransaction: any = null) => {
	return DraftCheckpoint.findOne({
		where: { draftId },
		order: [['historyKey', 'DESC']],
		transaction: sequelizeTransaction,
	});
};
