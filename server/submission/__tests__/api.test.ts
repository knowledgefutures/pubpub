/* global it, expect, beforeAll, afterAll */
import { setup, teardown, login, modelize } from 'stubstub';
import { Submission } from '../../models';

const models = modelize`
	Community community {
		Member {
			permissions: "admin"
			User admin {}
		}
		Collection collection {
			Member {
				permissions: "view"
				User collectionMember {}
			}
			Member {
				permissions: "manage"
				User collectionManager {}
			}
			CollectionPub {
				Pub spubbable {}
				Pub spub {
					Member {
						permissions: "admin"
						User pubAdmin {}
					}
					Submission submission {
						status: "incomplete"
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

it('creates a new submission', async () => {
	const { admin, spub, community } = models;
	const agent = await login(admin);
	const {
		body: { pubId, status },
	} = await agent
		.post('/api/submissions')
		.send({
			communityId: community.id,
			pubId: spub.id,
		})
		.expect(201);
	expect(pubId).toEqual(spub.id);
	expect(status).toEqual('incomplete');
});

it('forbids pub admins to update pub status beyond completed', async () => {
	const { pubAdmin, submission } = models;
	const agent = await login(pubAdmin);
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

it('forbids collection editors to update pub status', async () => {
	const { submission, collectionMember, community } = models;
	const agent = await login(collectionMember);
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

it('allows pub editors to set submitted status', async () => {
	const { pubAdmin, submission, spub } = models;
	const agent = await login(pubAdmin);
	await agent
		.put('/api/submissions')
		.send({
			id: submission.id,
			pubId: spub.id,
			status: 'submitted',
		})
		.expect(201);
	const { status } = await Submission.findOne({ where: { id: submission.id } });
	expect(status).toEqual('submitted');
});

it('forbids admins to update status out of one of [submitted, accepted, declined]', async () => {
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

it('forbids normal user to delete a submission', async () => {
	const { guest, submission, community } = models;
	const agent = await login(guest);
	await agent
		.delete('/api/submissions')
		.send({ id: submission.id, communityId: community.id })
		.expect(403);
	const submissionNow = await Submission.findOne({ where: { id: submission.id } });
	expect(submissionNow.id).toEqual(submission.id);
});

it('allows admin to delete a submission', async () => {
	const { admin, community, submission } = models;
	const agent = await login(admin);
	await agent
		.delete('/api/submissions')
		.send({ id: submission.id, communityId: community.id })
		.expect(200);
	const submissionNow = await Submission.findOne({ where: { id: submission.id } });
	expect(submissionNow).toEqual(null);
});

teardown(afterAll);
