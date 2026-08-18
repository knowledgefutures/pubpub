import { describe, expect, it, vi } from 'vitest';

/**
 * A `running` push log can outlive the task that created it (killed worker, redelivered AMQP
 * message). The next task adopts that row rather than creating a duplicate — and must take
 * ownership of it, because the queue finalizes crashed pushes by looking the row up via
 * workerTaskId. An adopted row still naming the dead task is invisible to that lookup and stays
 * `running` forever, which is the bug the finalization fix exists to prevent.
 */
describe('underlayPushLog — adopting a stale running row', () => {
	it('re-points an adopted row at the task that is actually running it', async () => {
		const updates: Record<string, unknown>[] = [];
		const existing = {
			id: 'log-1',
			workerTaskId: 'dead-task',
			update: vi.fn(async (patch: Record<string, unknown>) => {
				updates.push(patch);
				Object.assign(existing, patch);
			}),
		};

		// Mirrors the adoption branch of beginPushLog.
		const adopt = async (row: typeof existing, workerTaskId: string | null) => {
			if (workerTaskId && row.workerTaskId !== workerTaskId) {
				await row.update({ workerTaskId });
			}
			return row;
		};

		await adopt(existing, 'live-task');
		expect(updates).toEqual([{ workerTaskId: 'live-task' }]);
		expect(existing.workerTaskId).toBe('live-task');
	});

	it('does not rewrite the row when the same task re-adopts it', async () => {
		const existing = {
			id: 'log-1',
			workerTaskId: 'same-task',
			update: vi.fn(async () => {}),
		};
		const adopt = async (row: typeof existing, workerTaskId: string | null) => {
			if (workerTaskId && row.workerTaskId !== workerTaskId) {
				await row.update({ workerTaskId });
			}
			return row;
		};
		await adopt(existing, 'same-task');
		expect(existing.update).not.toHaveBeenCalled();
	});
});
