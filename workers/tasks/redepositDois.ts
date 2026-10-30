import {
	getRedepositPlan,
	type RedepositOptions,
	type RedepositProgress,
	runRedeposit,
} from 'server/doi/redeposit';
import { WorkerTask } from 'server/models';
import { updateWorkerTask } from 'server/workerTask/queries';

type RedepositDoisInput = RedepositOptions & {
	communityId: string;
	workerTaskId?: string;
	/** Run every check without sending anything. */
	checkOnly?: boolean;
	/** How long to keep reading Crossref's submission logs after the last send. */
	verifyForMs?: number;
	verifyIntervalMs?: number;
};

const progressThrottleMs = 2000;

/**
 * Redeposit a community's DOIs with Crossref. Every result so far is written to the WorkerTask's
 * output while it runs, so an interrupted run still shows what was sent. The superadmin dashboard
 * can ask it to stop by setting `stopRequested` on the input.
 */
export const redepositDoisTask = async (input: RedepositDoisInput) => {
	const { communityId, workerTaskId, pubSlug, limit, checkOnly, verifyForMs, verifyIntervalMs } =
		input;
	const plan = await getRedepositPlan(communityId, { pubSlug, limit });
	const startedAt = new Date().toISOString();
	const planSummary = {
		doiPrefix: plan.doiPrefix,
		submissionHost: plan.submissionHost,
		electronicIssn: plan.community.electronicIssn,
		printIssn: plan.community.printIssn,
		warnings: plan.warnings,
	};
	let lastUpdate = 0;

	console.info(`[redeposit] ${plan.community.subdomain}: ${plan.items.length} DOIs to redeposit`);

	const writeProgress = async (progress: RedepositProgress, force = false) => {
		const now = Date.now();
		if (!workerTaskId || (!force && now - lastUpdate < progressThrottleMs)) {
			return;
		}
		lastUpdate = now;
		await updateWorkerTask({
			id: workerTaskId,
			body: {
				output: {
					startedAt,
					plan: planSummary,
					progress: {
						phase: progress.phase,
						total: progress.total,
						processed: progress.processed,
						current: progress.current && {
							title: progress.current.title,
							doi: progress.current.doi,
						},
					},
					results: progress.results,
				},
			},
		});
	};

	const summary = await runRedeposit(plan, {
		checkOnly,
		verifyForMs,
		verifyIntervalMs,
		shouldStop: async () => {
			if (!workerTaskId) {
				return false;
			}
			const task = await WorkerTask.findByPk(workerTaskId, { attributes: ['input'] });
			return Boolean((task?.input as any)?.stopRequested);
		},
		onProgress: (progress) => {
			const latest = progress.results[progress.results.length - 1];
			if (progress.phase === 'sending' && latest && latest.status !== 'submitted') {
				console.warn(`[redeposit] ${latest.status} ${latest.doi}: ${latest.message}`);
			}
			// Log reads finish a round at a time, so always record those, and the last send.
			const force = progress.phase === 'verifying' || progress.processed === progress.total;
			return writeProgress(progress, force);
		},
	});

	console.info(
		`[redeposit] ${plan.community.subdomain}: ${JSON.stringify(summary.counts)}${summary.stopped ? ', stopped early' : ''}`,
	);

	return {
		startedAt,
		finishedAt: new Date().toISOString(),
		plan: planSummary,
		...summary,
	};
};
