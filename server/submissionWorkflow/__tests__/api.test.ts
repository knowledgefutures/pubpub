/* global it, expect, beforeAll, afterAll */
import { setup, teardown, login, modelize } from 'stubstub';
import { SubmissionWorkflow } from '../../models';

const models = modelize`
	Community {
		Member {
			permissions: "admin"
			User admin {}
		}

		Member {
			permissions: "view"
			User collectionMember {}
		}
		Member {
			permissions: "manage"
			User collectionManager {}
		}
		Collection collection {

			SubmissionWorkflow submissionWorkflow {enabled: false}
			SubmissionWorkflow destroyThisSubmissionWorkflow {enabled: false}
		}
	}
	Community {
		Member {
			permissions: "admin"
			User anotherAdmin {}
		}
			
	}
	User guest {}
	User anotherGuest {}

`;

setup(beforeAll, async () => {
	await models.resolve();
});

it('allows a Community manager to create a new submission workflow', async () => {
	const { admin, collection } = models;
	const agent = await login(admin);
	const {
		body: { enabled, targetEmailAddress, collectionId },
	} = await agent
		.post('/api/submissionWorkflows')
		.send({
			collectionId: collection.id,
			enabled: true,
			targetEmailAddress: 'finnandjakeforwvwer@adventuretime.com',
		})
		.expect(201);

	expect(collectionId).toEqual(collection.id);
	expect(enabled).toEqual(true);
	expect(targetEmailAddress).toEqual('finnandjakeforwvwer@adventuretime.com');
});

it('forbids a different Community manager from creating a new submission workflow', async () => {
	const { collection, anotherAdmin } = models;
	const agent = await login(anotherAdmin);
	await agent
		.post('/api/submissionWorkflows')
		.send({
			collectionId: collection.id,

			enabled: true,
			targetEmailAddress: 'finnandjakeforwvwer@adventuretime.com',
		})
		.expect(403);
});

it('forbids a random user from creating a submission workflow', async () => {
	const { collection, guest, anotherGuest } = models;
	const agent = await login(guest);
	await agent
		.post('/api/submissionWorkflows')
		.send({
			collectionId: collection.id,

			enabled: true,
			targetEmailAddress: 'finnandjakeforwvwer@adventuretime.com',
		})
		.expect(403);

	const anotherAgent = await login(anotherGuest);
	await anotherAgent
		.post('/api/submissionWorkflows')
		.send({
			collectionId: collection.id,

			enabled: true,
			targetEmailAddress: 'finnandjakeforwvwer@adventuretime.com',
		})
		.expect(403);
});

it('forbids a non mananger from creating a submission workflow', async () => {
	const { collection, collectionMember } = models;
	const agent = await login(collectionMember);
	await agent
		.post('/api/submissionWorkflows')
		.send({
			collectionId: collection.id,

			enabled: true,
			targetEmailAddress: 'finnandjakeforwvwer@adventuretime.com',
		})
		.expect(403);
});

it('allows a Community manager to update an existing workflow', async () => {
	const { collectionManager, collection } = models;
	const agent = await login(collectionManager);
	const enabled = true;
	await agent
		.put('/api/submissionWorkflows')
		.send({
			collectionId: collection.id,

			enabled,
		})
		.expect(200);

	const updatedSubmission = await SubmissionWorkflow.findOne({
		where: { collectionId: collection.id },
	});
	expect(updatedSubmission).toMatchObject({ enabled });
});

it('forbids a non-Community manager or attacker from updating a workflow', async () => {
	const { collectionMember, collection, anotherAdmin } = models;
	const agent = await login(collectionMember);
	const enabled = true;
	await agent
		.put('/api/submissionWorkflows')
		.send({
			collectionId: collection.id,
			enabled,
		})
		.expect(403);

	const anotherAgent = await login(anotherAdmin);
	await anotherAgent
		.put('/api/submissionWorkflows')
		.send({
			collectionId: collection.id,
			enabled,
		})
		.expect(403);
});

it('allows a Community manager to delete a workflow', async () => {
	const { admin, collection, destroyThisSubmissionWorkflow } = models;
	const agent = await login(admin);
	await agent
		.delete('/api/submissionWorkflows')
		.send({
			id: destroyThisSubmissionWorkflow.id,
			collectionId: collection.id,
		})
		.expect(200);
});

it('forbids a Community manager from deleting a workflow', async () => {
	const { collectionMember, collection, destroyThisSubmissionWorkflow } = models;
	const agent = await login(collectionMember);
	await agent
		.delete('/api/submissionWorkflows')
		.send({
			id: destroyThisSubmissionWorkflow.id,
			collectionId: collection.id,
		})
		.expect(403);
});

teardown(afterAll);
