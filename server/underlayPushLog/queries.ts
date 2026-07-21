import type { UnderlayPushLogStatus, UnderlayPushWarning } from './model';

import { Op } from 'sequelize';

import { UnderlayIntegration, UnderlayPushLog } from 'server/models';

/** Serialized push-log entry returned to clients (matches the ts-rest contract). */
export type PushLogView = {
	id: string;
	status: UnderlayPushLogStatus;
	startedAt: string;
	finishedAt: string | null;
	semver: string | null;
	recordCount: number | null;
	fileCount: number | null;
	message: string | null;
	error: string | null;
	warnings: UnderlayPushWarning[];
	workerTaskId: string | null;
};

/** Entries older than this are pruned when a new push begins. */
const RETENTION_DAYS = 90;

/**
 * A `running` log older than this is treated as stale (its worker died without finalizing), so it
 * neither blocks new pushes nor shows as "in progress" forever.
 */
const STALE_RUNNING_MS = 6 * 60 * 60 * 1000;

const toView = (row: UnderlayPushLog): PushLogView => ({
	id: row.id,
	status: row.status,
	startedAt: new Date(row.startedAt).toISOString(),
	finishedAt: row.finishedAt ? new Date(row.finishedAt).toISOString() : null,
	semver: row.semver,
	recordCount: row.recordCount,
	fileCount: row.fileCount,
	message: row.message,
	error: row.error,
	warnings: row.warnings ?? [],
	workerTaskId: row.workerTaskId,
});

const staleCutoff = () => new Date(Date.now() - STALE_RUNNING_MS);

/** The most recent non-stale `running` log for a community, if any. */
const findRunningRow = async (communityId: string): Promise<UnderlayPushLog | null> =>
	UnderlayPushLog.findOne({
		where: { communityId, status: 'running', startedAt: { [Op.gte]: staleCutoff() } },
		order: [['startedAt', 'DESC']],
	});

/**
 * Begin a push: reuse an existing fresh `running` log for the community if one exists (so the manual
 * path's handler-created log is adopted by the worker rather than duplicated), else create a new one.
 * Prunes entries older than the retention window as a side effect. Returns null if the community has
 * no integration row (never expected on a configured push).
 */
export const beginPushLog = async (
	communityId: string,
	workerTaskId?: string | null,
): Promise<UnderlayPushLog | null> => {
	const integration = await UnderlayIntegration.findOne({ where: { communityId } });
	if (!integration) {
		return null;
	}

	// Retention: drop this integration's history older than 90 days (prune-on-write; no cron).
	await UnderlayPushLog.destroy({
		where: {
			underlayIntegrationId: integration.id,
			startedAt: { [Op.lt]: new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000) },
		},
	});

	const existing = await findRunningRow(communityId);
	if (existing) {
		if (workerTaskId && !existing.workerTaskId) {
			await existing.update({ workerTaskId });
		}
		return existing;
	}

	return UnderlayPushLog.create({
		underlayIntegrationId: integration.id,
		communityId,
		workerTaskId: workerTaskId ?? null,
		status: 'running',
	});
};

export const finishPushLog = async (
	logId: string,
	result: {
		status: Exclude<UnderlayPushLogStatus, 'running'>;
		semver?: string | null;
		recordCount?: number | null;
		fileCount?: number | null;
		message?: string | null;
		error?: string | null;
		warnings?: UnderlayPushWarning[];
	},
): Promise<void> => {
	const row = await UnderlayPushLog.findByPk(logId);
	if (!row) {
		return;
	}
	await row.update({
		status: result.status,
		finishedAt: new Date(),
		semver: result.semver ?? null,
		recordCount: result.recordCount ?? null,
		fileCount: result.fileCount ?? null,
		message: result.message ?? null,
		error: result.error ?? null,
		warnings: result.warnings ?? [],
	});
};

/** Newest-first push history for a community (capped). */
export const getPushHistory = async (communityId: string, limit = 50): Promise<PushLogView[]> => {
	const rows = await UnderlayPushLog.findAll({
		where: { communityId },
		order: [['startedAt', 'DESC']],
		limit,
	});
	return rows.map(toView);
};

/**
 * The push state needed to render the settings page on reload: the in-progress push (if any) and the
 * most recent finished push. A stale `running` row (dead worker) is ignored as current and, if it's
 * the latest, surfaced as `lastPush` so it doesn't hide history.
 */
export const getPushState = async (
	communityId: string,
): Promise<{ currentPush: PushLogView | null; lastPush: PushLogView | null }> => {
	const running = await findRunningRow(communityId);
	const lastFinished = await UnderlayPushLog.findOne({
		where: { communityId, status: { [Op.ne]: 'running' } },
		order: [['startedAt', 'DESC']],
	});
	return {
		currentPush: running ? toView(running) : null,
		lastPush: lastFinished ? toView(lastFinished) : null,
	};
};

/** True if a fresh push is already running for this community (concurrency guard). */
export const hasRunningPush = async (communityId: string): Promise<UnderlayPushLog | null> =>
	findRunningRow(communityId);
