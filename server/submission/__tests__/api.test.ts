/* global describe, it, expect, beforeAll, afterAll */
import { setup, teardown, login, modelize } from 'stubstub';
import { Member, Submission } from 'server/models';

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
			}
			Member {
				permissions: "view"
				User collectionViewer {}
			}
			Member {
				permissions: "manage"
				User collectionManager {}
			}
			CollectionPub {
				Pub spub {
					Member {
						permissions: "manage"
						User pubManager {}
					}
					Submission submission {
						status: "incomplete"
						submissionWorkflow
					}
				}
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

describe('/api/submissions', () => {
	it('forbids a visitor to submit to a disabled workflow', async () => {
		const { guest, disabledWorkflow } = models;
		const agent = await login(guest);
		await agent
			.post('/api/submissions')
			.send({ submissionWorkflowId: disabledWorkflow.id })
			.expect(403);
	});

	it('allows a visitor to create a new submission', async () => {
		const { guest, submissionWorkflow } = models;
		const agent = await login(guest);
		const {
			body: { pubId, status },
		} = await agent
			.post('/api/submissions')
			.send({ submissionWorkflowId: submissionWorkflow.id })
			.expect(201);
		expect(await Member.count({ where: { pubId, userId: guest.id } })).toEqual(1);
		expect(status).toEqual('incomplete');
	});

	it('forbids pub managers to update pub status beyond completed', async () => {
		const { pubManager, submission } = models;
		const agent = await login(pubManager);
		await agent
			.put('/api/submissions')
			.send({
				id: submission.id,
				status: 'accepted',
			})
			.expect(403);
	});

	it('forbids admins of another community to update pub status', async () => {
		const { submission, community, collection, anotherAdmin } = models;
		const agent = await login(anotherAdmin);
		await agent
			.put('/api/submissions')
			.send({
				communityId: community.id,
				collectionId: collection.id,
				id: submission.id,
				status: 'completed',
			})
			.expect(403);
	});

	it('forbids collection viewers to update pub status', async () => {
		const { submission, collectionViewer, community } = models;
		const agent = await login(collectionViewer);
		await agent
			.put('/api/submissions')
			.send({
				communityId: community.id,
				id: submission.id,
				status: 'completed',
			})
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

	it('allows pub managers to set submitted status', async () => {
		const { pubManager, submission, spub } = models;
		const agent = await login(pubManager);
		await agent
			.put('/api/submissions')
			.send({
				id: submission.id,
				pubId: spub.id,
				status: 'submitted',
			})
			.expect(201);
		const { status, submittedAt } = await Submission.findOne({ where: { id: submission.id } });
		expect(status).toEqual('submitted');
		expect(Number.isNaN(new Date(submittedAt).getTime())).toEqual(false);
	});

	it('forbids admins from updating status out of one of [submitted, accepted, declined]', async () => {
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

	it('allows collection managers to update pub status', async () => {
		const { collection, collectionManager, submission } = models;
		const agent = await login(collectionManager);
		await agent
			.put('/api/submissions')
			.send({
				collectionId: collection.id,
				id: submission.id,
				status: 'accepted',
			})
			.expect(201);
		const submissionNow = await Submission.findOne({ where: { id: submission.id } });
		expect(submissionNow.status).toEqual('accepted');
	});
});

teardown(afterAll);
