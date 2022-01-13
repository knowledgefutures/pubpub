/* global describe, it, expect, beforeAll, afterAll, beforeEach, jest */
import { setup, teardown, login, modelize, expectCreatedActivityItem, stub } from 'stubstub';
import * as types from 'types';
import { Member, Submission } from 'server/models';
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
	stub('server/utils/email', {
		sendEmail: sendEmailMock,
	});
});

beforeEach(() => {
	sendEmailMock.mockClear();
});

describe('/api/submissions', () => {
	it('forbids pub managers to update pub status beyond pending', async () => {
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
			.send({ id: submission.id, status: 'pending' })
			.expect(403);
	});

	it('forbids collection editors to update pub status', async () => {
		const { submission, collectionEditor } = models;
		const agent = await login(collectionEditor);
		await agent
			.put('/api/submissions')
			.send({ id: submission.id, status: 'pending' })
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

	it('allows pub managers to set submission status to pending', async () => {
		const { pubManager, submission } = models;
		const agent = await login(pubManager);
		await agent
			.put('/api/submissions')
			.send({ id: submission.id, status: 'pending' })
			.expect(201);
		const { status, submittedAt } = await Submission.findOne({ where: { id: submission.id } });
		expect(status).toEqual('pending');
		expect(Number.isNaN(new Date(submittedAt).getTime())).toEqual(false);
		await finishDeferredTasks();
		expect(sendEmailMock).toHaveBeenCalled();
	});

	it('forbids admins from updating status out of one of [pending, accepted, declined]', async () => {
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
			kind: 'submission-status-changed',
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
			kind: 'submission-status-changed',
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
		await expectCreatedActivityItem(
			agent.delete('/api/submissions').send({ id: submission.id }).expect(200),
		).toMatchObject({
			kind: 'submission-deleted',
			pubId: submission.pubId,
			actorId: admin.id,
			payload: {
				submissionId: submission.id,
			},
		});
		const submissionNow = await Submission.findOne({ where: { id: submission.id } });
		expect(submissionNow).toEqual(null);
	});

	it('allows a visitor to create a new submission', async () => {
		const { guest, submissionWorkflow } = models;
		const agent = await login(guest);
		const {
			body: { pubId, status },
		} = await expectCreatedActivityItem(
			agent
				.post('/api/submissions')
				.send({ submissionWorkflowId: submissionWorkflow.id })
				.expect(201),
		).toMatchResultingObject((response) => ({
			kind: 'submission-created',
			pubId: response.body.pubId,
			actorId: guest.id,
		}));
		expect(await Member.count({ where: { pubId, userId: guest.id } })).toEqual(1);
		expect(status).toEqual('incomplete');
	});
});

teardown(afterAll);
