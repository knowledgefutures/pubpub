import { setup, teardown, login, modelize, expectCreatedActivityItem, stub } from 'stubstub';
import * as types from 'types';
import { Submission, SubmissionWorkflow } from 'server/models';
import { finishDeferredTasks } from 'server/utils/deferred';

const models = modelize`
	Community community {
		Member {
			permissions: "admin"
			User admin {}
		}
		Collection collection {
			SubmissionWorkflow disabledWorkflow {
				title: "Some disabled workflow"
			}
			SubmissionWorkflow submissionWorkflow {
				title: "Some enabled workflow"
				enabled: true
				Submission submission {
					status: "incomplete"
					Pub {
						Member {
							permissions: "manage"
							User pubManager {}
						}
					}
				}
			}
			Member {
				permissions: "edit"
				User collectionEditor {}
			}
			Member {
				permissions: "view"
				User collectionViewer {}
			}
			Member {
				permissions: "manage"
				User collectionManager {}
			}
		}
	}
	Community {
		Member {
			permissions: "admin"
			User anotherAdmin {}
		}
	}
	User guest {}
`;

setup(beforeAll, async () => {
	await models.resolve();
});

let sendEmailMock: jest.Mock = null as any;
beforeAll(() => {
	sendEmailMock = jest.fn();
	stub('server/submission/emails', {
		sendSubmissionEmail: sendEmailMock,
	});
	stub('server/submission/abstract', {
		appendAbstractToPubDraft: () => {},
	});
});

beforeEach(() => {
	sendEmailMock.mockClear();
});

describe('/api/submissions', () => {
	it('forbids pub managers to update pub status beyond received', async () => {
		const { pubManager, submission } = models;
		const agent = await login(pubManager);
		await agent
			.put('/api/submissions')
			.send({ id: submission.id, status: 'accepted' })
			.expect(403);
	});

	it('forbids admins of another community to update status', async () => {
		const { submission, anotherAdmin } = models;
		const agent = await login(anotherAdmin);
		await agent
			.put('/api/submissions')
			.send({ id: submission.id, status: 'received' })
			.expect(403);
	});

	it('forbids collection editors to update pub status', async () => {
		const { submission, collectionEditor } = models;
		const agent = await login(collectionEditor);
		await agent
			.put('/api/submissions')
			.send({ id: submission.id, status: 'received' })
			.expect(403);
	});

	it('forbids admins to update from incomplete status', async () => {
		const { admin, submission } = models;
		const agent = await login(admin);
		await agent
			.put('/api/submissions')
			.send({
				id: submission.id,
				status: 'accepted',
			})
			.expect(403);
	});

	it('forbids normal user to delete a submission', async () => {
		const { guest, submission } = models;
		const agent = await login(guest);
		await agent.delete('/api/submissions').send({ id: submission.id }).expect(403);
		const submissionNow = await Submission.findOne({ where: { id: submission.id } });
		expect(submissionNow.id).toEqual(submission.id);
	});

	it('forbids a visitor to submit to a disabled workflow', async () => {
		const { guest, disabledWorkflow } = models;
		const agent = await login(guest);
		await agent
			.post('/api/submissions')
			.send({ submissionWorkflowId: disabledWorkflow.id })
			.expect(403);
	});

	it('allows pub managers to set submission status to received', async () => {
		const { pubManager, submission } = models;
		const agent = await login(pubManager);
		await agent
			.put('/api/submissions')
			.send({ id: submission.id, status: 'received' })
			.expect(201);
		const { status, submittedAt } = await Submission.findOne({ where: { id: submission.id } });
		expect(status).toEqual('received');
		expect(Number.isNaN(new Date(submittedAt).getTime())).toEqual(false);
		await finishDeferredTasks();
		expect(sendEmailMock).toHaveBeenCalled();
	});

	it('forbids admins from updating status out of one of [received, accepted, declined]', async () => {
		const { admin, submission } = models;
		const agent = await login(admin);
		await agent
			.put('/api/submissions')
			.send({
				id: submission.id,
				status: 'incomplete',
			})
			.expect(403);
	});

	it('allows collection managers to update pub status to accepted', async () => {
		const { collectionManager, submission } = models;
		const agent = await login(collectionManager);
		const prevSubmission: types.Submission = await Submission.findOne({
			where: { id: submission.id },
		});
		await expectCreatedActivityItem(
			agent
				.put('/api/submissions')
				.send({
					id: submission.id,
					status: 'accepted',
				})
				.expect(201),
		).toMatchResultingObject((response) => ({
			kind: 'submission-status-updated',
			pubId: submission.pubId,
			actorId: collectionManager.id,
			payload: {
				submissionId: submission.id,
				status: {
					from: prevSubmission.status,
					to: response.body.status,
				},
			},
		}));
		const { status } = await Submission.findOne({ where: { id: submission.id } });
		expect(status).toEqual('accepted');
		await finishDeferredTasks();
		expect(sendEmailMock).toHaveBeenCalled();
	});

	it('allows collection managers to update pub status to declined', async () => {
		const { collectionManager, submission } = models;
		const agent = await login(collectionManager);
		const prevSubmission: types.Submission = await Submission.findOne({
			where: { id: submission.id },
		});
		await expectCreatedActivityItem(
			agent
				.put('/api/submissions')
				.send({
					id: submission.id,
					status: 'declined',
					skipEmail: true,
				})
				.expect(201),
		).toMatchResultingObject((response) => ({
			kind: 'submission-status-updated',
			pubId: submission.pubId,
			actorId: collectionManager.id,
			payload: {
				submissionId: submission.id,
				status: {
					from: prevSubmission.status,
					to: response.body.status,
				},
			},
		}));
		const { status } = await Submission.findOne({ where: { id: submission.id } });
		expect(status).toEqual('declined');
		await finishDeferredTasks();
		expect(sendEmailMock).toHaveBeenCalledTimes(0);
	});

	it('allows admin to delete a submission', async () => {
		const { admin, submission } = models;
		const agent = await login(admin);
		await agent.delete('/api/submissions').send({ id: submission.id }).expect(200);
		const submissionNow = await Submission.findOne({ where: { id: submission.id } });
		expect(submissionNow).toEqual(null);
	});

	it('allows a visitor to create a new submission', async () => {
		const { guest, submissionWorkflow } = models;
		const agent = await login(guest);
		await agent
			.post('/api/submissions')
			.send({ submissionWorkflowId: submissionWorkflow.id })
			.expect(201);

		expect(
			await SubmissionWorkflow.count({
				where: { id: submissionWorkflow.id },
			}),
		).toEqual(1);
	});
});

teardown(afterAll);
