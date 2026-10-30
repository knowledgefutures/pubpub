import { vi } from 'vitest';

import { Pub, WorkerTask } from 'server/models';
import { login, modelize, setup } from 'stubstub';
import { redepositDoisTask } from 'workers/tasks/redepositDois';

import { setDoiData } from '../queries';
import { getRedepositPlan, runRedeposit } from '../redeposit';

const models = modelize`
	Community community {
		issn: "2644-2353"
		Pub articlePub {
			Release {}
		}
		Pub acceptedManuscriptPub {
			Release {}
		}
		Pub externalDoiPub {
			Release {}
		}
		Pub unreleasedPub {}
		Collection issue {
			title: "Volume 1, Issue 1"
			kind: "issue"
		}
	}
	User superAdmin {
		isSuperAdmin: true
	}
	User regularUser {}
`;

const { submitDoiData, addWorkerTask } = vi.hoisted(() => ({
	submitDoiData: vi.fn(),
	addWorkerTask: vi.fn(),
}));

vi.mock('server/doi/submit', () => ({ submitDoiData }));
vi.mock('server/utils/workers', () => ({ addWorkerTask }));

// Superadmin routes live on the main PubPub domain, not a community's.
const host = 'www.pubpub.org';

const deposit = (
	params: { communityId: string; pubId?: string; collectionId?: string; contentVersion?: string },
	target: 'pub' | 'collection',
) =>
	setDoiData(
		{
			collectionId: undefined,
			pubId: undefined,
			contentVersion: undefined,
			reviewType: undefined,
			reviewRecommendation: undefined,
			...params,
		},
		target,
	);

const getJournalDeposits = () =>
	submitDoiData.mock.calls.map((call) => call[0].doi_batch.body.journal);

setup(beforeAll, async () => {
	await models.resolve();
	const { community, articlePub, acceptedManuscriptPub, externalDoiPub, unreleasedPub, issue } =
		models;
	// Give everything an initial deposit, the way the AssignDoi dialog would.
	await deposit({ communityId: community.id, pubId: articlePub.id }, 'pub');
	await deposit(
		{ communityId: community.id, pubId: acceptedManuscriptPub.id, contentVersion: 'am' },
		'pub',
	);
	await deposit({ communityId: community.id, collectionId: issue.id }, 'collection');
	await deposit({ communityId: community.id, pubId: unreleasedPub.id }, 'pub');
	// A DOI PubPub didn't register, and a pub whose release was since removed.
	await Pub.update({ doi: '10.9999/external' }, { where: { id: externalDoiPub.id } });
});

afterEach(() => {
	submitDoiData.mockReset();
	addWorkerTask.mockReset();
});

it("plans only DOIs that PubPub deposited, keeping each pub's content version", async () => {
	const { community, articlePub, acceptedManuscriptPub, issue } = models;
	const plan = await getRedepositPlan(community.id);
	expect(plan.community.issn).toEqual('26442353');
	expect(plan.items[0].id).toEqual(issue.id);
	expect(plan.items.map((item) => item.id).sort()).toEqual(
		[issue.id, articlePub.id, acceptedManuscriptPub.id].sort(),
	);
	const manuscript = plan.items.find((item) => item.id === acceptedManuscriptPub.id);
	expect(manuscript?.contentVersion).toEqual('am');
	expect(plan.skipped).toEqual({ pubsWithoutDepositRecord: 1, pubsWithoutRelease: 1 });
});

it('plans a single pub without collections', async () => {
	const { community, articlePub } = models;
	const plan = await getRedepositPlan(community.id, { pubSlug: articlePub.slug });
	expect(plan.items.map((item) => item.id)).toEqual([articlePub.id]);
});

it('redeposits with the ISSN and carries on past a failure', async () => {
	const { community, acceptedManuscriptPub } = models;
	const plan = await getRedepositPlan(community.id);
	// Fail the collection's deposit; pubs deposit twice each (disconnect, then connect).
	submitDoiData.mockRejectedValueOnce(new Error('Crossref said no'));
	const summary = await runRedeposit(plan);
	expect(summary).toMatchObject({ total: 3, processed: 3, succeeded: 2, failed: 1 });
	expect(summary.results[0]).toMatchObject({ ok: false, error: 'Crossref said no' });
	const deposits = getJournalDeposits();
	deposits.forEach((journal) => {
		expect(journal.journal_metadata.issn).toEqual([
			{ '@media_type': 'electronic', '#text': '26442353' },
		]);
	});
	const manuscriptDoi = (await Pub.findByPk(acceptedManuscriptPub.id))?.doi;
	const manuscriptDeposit = [...deposits]
		.reverse()
		.find((journal) => journal.journal_article?.doi_data.doi === manuscriptDoi);
	expect(manuscriptDeposit.journal_article.doi_data.resource['@content_version']).toEqual('am');
});

it('stops when asked', async () => {
	const { community } = models;
	const plan = await getRedepositPlan(community.id);
	const summary = await runRedeposit(plan, {
		shouldStop: () => submitDoiData.mock.calls.length > 0,
	});
	expect(summary).toMatchObject({ total: 3, processed: 1, stopped: true });
});

it('runs as a worker task and honours a stop request', async () => {
	const { community } = models;
	const task = await WorkerTask.create({
		type: 'redepositDois',
		input: { communityId: community.id },
		isProcessing: true,
	});
	const result = await redepositDoisTask({ communityId: community.id, workerTaskId: task.id });
	expect(result).toMatchObject({ total: 3, succeeded: 3, failed: 0, stopped: false });

	await task.update({ input: { communityId: community.id, stopRequested: true } });
	const stopped = await redepositDoisTask({ communityId: community.id, workerTaskId: task.id });
	expect(stopped).toMatchObject({ total: 3, processed: 0, stopped: true });
	// The queue marks the task finished once it returns.
	await task.update({ isProcessing: false, output: stopped });
});

it('hides the redeposit API from anyone but superadmins', async () => {
	// Like the other superadmin routes, a non-superadmin gets a 404.
	const { community, regularUser } = models;
	const agent = await login(regularUser);
	await agent
		.get('/api/superadmin/doi-redeposit')
		.set('Host', host)
		.query({ communityId: community.id })
		.expect(404);
	await agent
		.post('/api/superadmin/doi-redeposit')
		.set('Host', host)
		.send({ communityId: community.id })
		.expect(404);
});

it('shows the plan and starts one run at a time', async () => {
	const { community, superAdmin } = models;
	addWorkerTask.mockImplementation(({ type, input }) =>
		WorkerTask.create({ type, input, isProcessing: true }),
	);
	const agent = await login(superAdmin);
	const { body: plan } = await agent
		.get('/api/superadmin/doi-redeposit')
		.set('Host', host)
		.query({ communityId: community.id })
		.expect(200);
	expect(plan).toMatchObject({ collectionCount: 1, pubCount: 2 });
	expect(plan.tasks[0].output).toMatchObject({ stopped: true, failures: [] });

	const { body: task } = await agent
		.post('/api/superadmin/doi-redeposit')
		.set('Host', host)
		.send({ communityId: community.id })
		.expect(200);
	expect(addWorkerTask).toHaveBeenCalledWith({
		type: 'redepositDois',
		input: { communityId: community.id },
	});
	await agent
		.post('/api/superadmin/doi-redeposit')
		.set('Host', host)
		.send({ communityId: community.id })
		.expect(409);

	const { body: stopped } = await agent
		.post(`/api/superadmin/doi-redeposit/tasks/${task.id}/stop`)
		.set('Host', host)
		.expect(200);
	expect(stopped.input.stopRequested).toEqual(true);
});
