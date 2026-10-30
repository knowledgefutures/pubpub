import { getRedepositPlan, type RedepositOptions, runRedeposit } from 'server/doi/redeposit';
import { WorkerTask } from 'server/models';
import { updateWorkerTask } from 'server/workerTask/queries';

type RedepositDoisInput = RedepositOptions & {
	communityId: string;
	workerTaskId?: string;
};

const progressThrottleMs = 2000;

/**
 * Redeposit a community's DOIs with Crossref. Progress is written to the WorkerTask's output while
 * it runs, and the superadmin dashboard can ask it to stop by setting `stopRequested` on the input.
 */
export const redepositDoisTask = async (input: RedepositDoisInput) => {
	const { communityId, workerTaskId, pubSlug, limit } = input;
	const plan = await getRedepositPlan(communityId, { pubSlug, limit });
	const startedAt = new Date().toISOString();
	const failures: { title: string; doi: string; error?: string }[] = [];
	let lastUpdate = 0;

	console.info(`[redeposit] ${plan.community.subdomain}: ${plan.items.length} DOIs to redeposit`);

	const summary = await runRedeposit(plan, {
		shouldStop: async () => {
			if (!workerTaskId) {
				return false;
			}
			const task = await WorkerTask.findByPk(workerTaskId, { attributes: ['input'] });
			return Boolean((task?.input as any)?.stopRequested);
		},
		onProgress: async (progress, result) => {
			if (!result.ok) {
				failures.push({ title: result.title, doi: result.doi, error: result.error });
				console.warn(`[redeposit] failed ${result.doi}: ${result.error}`);
			}
			const now = Date.now();
			if (!workerTaskId || now - lastUpdate < progressThrottleMs) {
				return;
			}
			lastUpdate = now;
			await updateWorkerTask({
				id: workerTaskId,
				body: {
					output: {
						startedAt,
						progress: {
							total: progress.total,
							processed: progress.processed,
							failed: progress.failed,
							current: progress.current && {
								title: progress.current.title,
								doi: progress.current.doi,
							},
						},
						failures,
					},
				},
			});
		},
	});

	console.info(
		`[redeposit] ${plan.community.subdomain}: ${summary.succeeded} deposited, ${summary.failed} failed${summary.stopped ? ', stopped early' : ''}`,
	);

	return {
		startedAt,
		finishedAt: new Date().toISOString(),
		...summary,
	};
};
