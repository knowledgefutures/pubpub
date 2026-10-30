import { vi } from 'vitest';

import {
	Collection,
	CollectionPub,
	CrossrefDepositRecord,
	DepositTarget,
	Pub,
	PubEdge,
	WorkerTask,
} from 'server/models';
import { login, modelize, setup } from 'stubstub';
import { redepositDoisTask } from 'workers/tasks/redepositDois';

import { setDoiData } from '../queries';
import { getRedepositPlan, RedepositError, runRedeposit } from '../redeposit';

const models = modelize`
	Community community {
		electronicIssn: "2644-2353"
		Pub articlePub {
			Release {}
		}
		Pub manuscriptPub {
			Release {}
		}
		Pub movedPub {
			Release {}
		}
		Pub bookPub {
			Release {}
		}
		Pub editedDoiPub {
			Release {}
		}
		Pub referencesPub {
			Release {}
		}
		Pub unregisteredPub {
			Release {}
		}
		Pub parentPub {
			Release {}
		}
		Pub supplementPub {
			Release {}
		}
		Pub rejectedPub {
			Release {}
		}
		Pub slowPub {
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
		Collection laterIssue {
			title: "Volume 2, Issue 1"
			kind: "issue"
		}
		Collection book {
			title: "A book"
			kind: "book"
		}
	}
	Community dataciteCommunity {}
	User superAdmin {
		isSuperAdmin: true
	}
	User regularUser {}
`;

const {
	submitDoiData,
	addWorkerTask,
	getCrossrefWork,
	getCrossrefJournal,
	fetchSubmissionResult,
	validatePubRelationshipsForDeposit,
} = vi.hoisted(() => ({
	submitDoiData: vi.fn(),
	addWorkerTask: vi.fn(),
	getCrossrefWork: vi.fn(),
	getCrossrefJournal: vi.fn(),
	fetchSubmissionResult: vi.fn(),
	validatePubRelationshipsForDeposit: vi.fn(),
}));

vi.mock('server/doi/submit', async (importOriginal) => ({
	...(await importOriginal<object>()),
	submitDoiData,
}));
vi.mock('server/utils/workers', () => ({ addWorkerTask }));
// The real check asks Crossref whether connected pubs' DOIs exist.
vi.mock('server/doi/validate', () => ({ validatePubRelationshipsForDeposit }));
vi.mock('server/doi/crossrefChecks', async (importOriginal) => ({
	...(await importOriginal<object>()),
	getCrossrefWork,
	getCrossrefJournal,
	fetchSubmissionResult,
}));

// Superadmin routes live on the main PubPub domain, not a community's.
const host = 'www.pubpub.org';
const noWait = { verifyForMs: 1000, verifyIntervalMs: 0, sleep: async () => {} };

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

const doiOf = async (pub) => (await Pub.findByPk(pub.id))!.doi!;

/** Live Crossref records by DOI; anything not listed is an ordinary registered record. */
let crossrefWorks: Record<string, any> = {};
/** Submission log results by DOI; anything not listed succeeded. */
let submissionLogs: Record<string, any> = {};

const runFor = async (pub, options = {}) => {
	const plan = await getRedepositPlan(models.community.id, { pubSlug: pub.slug });
	return runRedeposit(plan, { ...noWait, ...options });
};

setup(beforeAll, async () => {
	await models.resolve();
	const { community, issue, book, laterIssue, parentPub, supplementPub } = models;
	await Collection.update({ metadata: { volume: '1', issue: '1' } }, { where: { id: issue.id } });
	await Collection.update(
		{ metadata: { volume: '2', issue: '1' } },
		{ where: { id: laterIssue.id } },
	);
	await Promise.all(
		['articlePub', 'movedPub', 'bookPub'].map((name) =>
			CollectionPub.create({
				collectionId: issue.id,
				pubId: models[name].id,
				rank: 'a',
				pubRank: 'm',
			}),
		),
	);
	// Give everything an initial deposit, the way the AssignDoi dialog would.
	await deposit({ communityId: community.id, collectionId: issue.id }, 'collection');
	for (const name of [
		'articlePub',
		'movedPub',
		'bookPub',
		'editedDoiPub',
		'referencesPub',
		'unregisteredPub',
		'parentPub',
		'supplementPub',
		'rejectedPub',
		'slowPub',
		'unreleasedPub',
	]) {
		// biome-ignore lint/performance/noAwaitInLoops: deposits are sequential
		await deposit({ communityId: community.id, pubId: models[name].id }, 'pub');
	}
	await deposit(
		{ communityId: community.id, pubId: models.manuscriptPub.id, contentVersion: 'am' },
		'pub',
	);

	// Changes made after those deposits, which a redeposit must not apply silently.
	await CollectionPub.create({
		collectionId: laterIssue.id,
		pubId: models.movedPub.id,
		rank: 'b',
		pubRank: 'a',
	});
	await CollectionPub.create({
		collectionId: book.id,
		pubId: models.bookPub.id,
		rank: 'a',
		pubRank: 'a',
	});
	await Pub.update({ doi: '10.21428/edited.doi' }, { where: { id: models.editedDoiPub.id } });
	await PubEdge.create({
		pubId: supplementPub.id,
		targetPubId: parentPub.id,
		relationType: 'supplement',
		pubIsParent: false,
		approvedByTarget: true,
		rank: 'a',
	});
	await Pub.update({ doi: '10.9999/external' }, { where: { id: models.externalDoiPub.id } });
	await DepositTarget.create({
		communityId: models.dataciteCommunity.id,
		service: 'datacite',
		doiPrefix: '10.5555',
	});

	crossrefWorks = {
		[await doiOf(models.referencesPub)]: { 'reference-count': 12, license: [{ URL: 'x' }] },
		[await doiOf(models.unregisteredPub)]: null,
	};
	submissionLogs = {
		[await doiOf(models.rejectedPub)]: {
			state: 'completed',
			records: [
				{
					doi: await doiOf(models.rejectedPub),
					status: 'Failure',
					message: 'ISSN conflict',
				},
			],
		},
		[await doiOf(models.slowPub)]: { state: 'pending' },
	};
});

beforeEach(() => {
	validatePubRelationshipsForDeposit.mockResolvedValue([]);
	getCrossrefJournal.mockResolvedValue({
		state: 'found',
		title: 'Something else entirely',
		issns: [{ value: '2644-2353', type: 'print' }],
	});
	getCrossrefWork.mockImplementation(async (doi) => {
		if (doi in crossrefWorks) {
			return crossrefWorks[doi]
				? { state: 'found', work: crossrefWorks[doi] }
				: { state: 'not_found' };
		}
		return { state: 'found', work: { 'reference-count': 0 } };
	});
	// The submission log is looked up by file name; remember which DOI each file was for.
	const submittedFiles: Record<string, string> = {};
	submitDoiData.mockImplementation(async (json) => {
		const { body } = json.doi_batch;
		const doi =
			body.journal?.journal_article?.doi_data?.doi ??
			body.journal?.journal_issue?.doi_data?.doi ??
			body.book?.content_item?.doi_data?.doi;
		submittedFiles[`${json.doi_batch.head.doi_batch_id}.xml`] = doi;
	});
	fetchSubmissionResult.mockImplementation(async (filename) => {
		const doi = submittedFiles[filename];
		return (
			submissionLogs[doi] ?? {
				state: 'completed',
				records: [{ doi, status: 'Success', message: 'Successfully updated' }],
			}
		);
	});
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('planning', () => {
	it('includes only DOIs PubPub deposited, and warns about the ISSN', async () => {
		const { community, issue } = models;
		const plan = await getRedepositPlan(community.id);
		expect(plan.community).toMatchObject({ electronicIssn: '26442353', printIssn: null });
		expect(plan.items[0].id).toEqual(issue.id);
		expect(plan.items).toHaveLength(12);
		expect(plan.skipped).toEqual({ pubsWithoutDepositRecord: 1, pubsWithoutRelease: 1 });
		expect(plan.warnings).toEqual([
			expect.stringContaining('registered to "Something else entirely"'),
			expect.stringContaining('as the print ISSN'),
		]);
	});

	it('refuses DataCite communities with a clear message', async () => {
		await expect(getRedepositPlan(models.dataciteCommunity.id)).rejects.toThrow(
			new RedepositError(
				'This community registers DOIs with DataCite. Redeposit only supports Crossref.',
			),
		);
	});
});

describe('checks before sending', () => {
	it('sends an unchanged article with the ISSN and its content version, and confirms it', async () => {
		const { manuscriptPub } = models;
		const summary = await runFor(manuscriptPub);
		expect(summary.results).toEqual([
			expect.objectContaining({ status: 'succeeded', message: 'Successfully updated' }),
		]);
		const { journal } = submitDoiData.mock.lastCall![0].doi_batch.body;
		expect(journal.journal_metadata.issn).toEqual([
			{ '@media_type': 'electronic', '#text': '26442353' },
		]);
		expect(journal.journal_article.doi_data.resource['@content_version']).toEqual('am');
		expect(journal.journal_article.doi_data.doi).toEqual(await doiOf(manuscriptPub));
	});

	it('keeps a copy of the deposit record it overwrites', async () => {
		const { articlePub } = models;
		const recordId = (await Pub.findByPk(articlePub.id))!.crossrefDepositRecordId!;
		const before = (await CrossrefDepositRecord.findByPk(recordId))!.depositJson;
		const summary = await runFor(articlePub);
		expect(summary.results[0].status).toEqual('succeeded');
		const backup = await CrossrefDepositRecord.findByPk(
			summary.results[0].backupDepositRecordId,
		);
		expect(backup?.depositJson).toEqual(before);
	});

	it.each([
		['movedPub', /issue would change from volume 1 issue 1 to volume 2 issue 1/],
		['bookPub', /would change from a journal article to a book chapter/],
		['editedDoiPub', /doesn't match its last deposit/],
		['supplementPub', /DOI would change from .* supplement connection/],
		['referencesPub', /Crossref has 12 references, license information for it/],
		['unregisteredPub', /isn't registered in Crossref/],
	])('skips %s without sending it', async (name, reason) => {
		const summary = await runFor(models[name]);
		expect(summary.results).toEqual([
			expect.objectContaining({ status: 'skipped', message: expect.stringMatching(reason) }),
		]);
		expect(submitDoiData).not.toHaveBeenCalled();
	});

	it("skips a pub whose connections can't be deposited", async () => {
		validatePubRelationshipsForDeposit.mockResolvedValue([
			{ message: '"Parent" has a DOI that does not exist in Crossref.' },
		]);
		const summary = await runFor(models.articlePub);
		expect(summary.results[0]).toMatchObject({
			status: 'skipped',
			message: `Its connections can't be deposited: "Parent" has a DOI that does not exist in Crossref.`,
		});
		expect(submitDoiData).not.toHaveBeenCalled();
	});

	it('sends nothing in a check-only run', async () => {
		const summary = await runRedeposit(await getRedepositPlan(models.community.id), {
			...noWait,
			checkOnly: true,
		});
		expect(submitDoiData).not.toHaveBeenCalled();
		expect(summary.counts).toEqual({ ready: 6, skipped: 6 });
	});
});

describe('reading the submission log', () => {
	it("reports Crossref's failure message", async () => {
		const summary = await runFor(models.rejectedPub);
		expect(summary.results[0]).toMatchObject({
			status: 'failed',
			message: 'Crossref: ISSN conflict',
		});
	});

	it('marks a deposit Crossref has not processed yet as unconfirmed', async () => {
		const summary = await runFor(models.slowPub);
		expect(summary.results[0]).toMatchObject({
			status: 'unverified',
			message: expect.stringContaining("hadn't finished processing"),
		});
	});

	it('reports a send that never reached Crossref and drops its backup', async () => {
		submitDoiData.mockRejectedValueOnce(new Error('Crossref submission failed (503)'));
		const records = await CrossrefDepositRecord.count();
		const summary = await runFor(models.articlePub);
		expect(summary.results[0]).toMatchObject({
			status: 'error',
			message: 'Sending to Crossref failed: Crossref submission failed (503)',
		});
		expect(await CrossrefDepositRecord.count()).toEqual(records);
	});
});

describe('as a worker task', () => {
	it('records results as it goes and honours a stop request', async () => {
		const { community } = models;
		const task = await WorkerTask.create({
			type: 'redepositDois',
			input: { communityId: community.id, checkOnly: true },
			isProcessing: true,
		});
		const result = await redepositDoisTask({
			communityId: community.id,
			workerTaskId: task.id,
			checkOnly: true,
		});
		expect(result).toMatchObject({ total: 12, processed: 12, stopped: false });
		expect(((await task.reload()).output as any).results).toHaveLength(12);

		await task.update({ input: { communityId: community.id, stopRequested: true } });
		const stopped = await redepositDoisTask({
			communityId: community.id,
			workerTaskId: task.id,
		});
		expect(stopped).toMatchObject({ total: 12, processed: 0, notRun: 12, stopped: true });
		// The queue marks the task finished once it returns.
		await task.update({ isProcessing: false, output: stopped });
	});
});

describe('superadmin API', () => {
	it('hides the redeposit API from anyone but superadmins', async () => {
		// Like the other superadmin routes, a non-superadmin gets a 404.
		const agent = await login(models.regularUser);
		await agent
			.get('/api/superadmin/doi-redeposit')
			.set('Host', host)
			.query({ communityId: models.community.id })
			.expect(404);
		await agent
			.post('/api/superadmin/doi-redeposit')
			.set('Host', host)
			.send({ communityId: models.community.id })
			.expect(404);
	});

	it('explains plan problems instead of queueing', async () => {
		const agent = await login(models.superAdmin);
		const { body } = await agent
			.post('/api/superadmin/doi-redeposit')
			.set('Host', host)
			.send({ communityId: models.dataciteCommunity.id })
			.expect(400);
		expect(body.message).toMatch(/DataCite/);
		const { body: noPub } = await agent
			.post('/api/superadmin/doi-redeposit')
			.set('Host', host)
			.send({ communityId: models.community.id, pubSlug: 'no-such-pub' })
			.expect(400);
		expect(noPub.message).toMatch(/No pub with slug "no-such-pub"/);
		expect(addWorkerTask).not.toHaveBeenCalled();
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
		expect(plan).toMatchObject({ collectionCount: 1, pubCount: 11 });

		const { body: task } = await agent
			.post('/api/superadmin/doi-redeposit')
			.set('Host', host)
			.send({ communityId: community.id, checkOnly: true })
			.expect(200);
		expect(addWorkerTask).toHaveBeenCalledWith({
			type: 'redepositDois',
			input: { communityId: community.id, checkOnly: true },
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
});
