/* global describe, it, expect, beforeAll, afterAll */
import { makeUser, makeCommunity, setup, teardown, login } from '../../../stubstub';
import { createCollection } from '../../collection/queries';
import { createCollectionAttribution } from '../queries';
import { CollectionAttribution } from '../../models';

let user;
let testCommunity;
let collection;

setup(beforeAll, async () => {
	user = await makeUser();
	testCommunity = await makeCommunity();
	collection = await createCollection({
		communityId: testCommunity.community.id,
		kind: 'issue',
		title: 'Just a test collection',
	});
});

describe('/api/collectionAttribution', () => {
	it('creates a collection attribution', async () => {
		const { admin, community } = testCommunity;
		const agent = await login(admin);
		const { body: attr } = await agent
			.post('/api/collectionAttributions')
			.send({
				order: 0,
				name: 'Test Person',
				communityId: community.id,
				collectionId: collection.id,
			})
			.expect(201);
		expect(attr.name).toEqual('Test Person');
	});

	it('creates a collection attribution associated to a user', async () => {
		const { admin, community } = testCommunity;
		const agent = await login(admin);
		const { body: attr } = await agent
			.post('/api/collectionAttributions')
			.send({
				order: 0,
				name: 'Test Person',
				communityId: community.id,
				collectionId: collection.id,
				userId: user.id,
			})
			.expect(201);
		expect(attr.user.id).toEqual(user.id);
	});

	it("does not create a collection attribution if you're just some schmoe", async () => {
		const { community } = testCommunity;
		const agent = await login(user);
		await agent
			.post('/api/collectionAttributions')
			.send({
				order: 0,
				name: 'Some Schmoe',
				communityId: community.id,
				collectionId: collection.id,
			})
			.expect(403);
	});

	it('updates collection attributions', async () => {
		const { admin, community } = testCommunity;
		const ca = await createCollectionAttribution({
			order: 0,
			name: 'Test Person',
			communityId: community.id,
			collectionId: collection.id,
		});
		const agent = await login(admin);
		const { body: attr } = await agent
			.put('/api/collectionAttributions')
			.send({
				affiliation: 'Test University of Testing',
				communityId: community.id,
				collectionId: collection.id,
				id: ca.id,
			})
			.expect(200);
		expect(attr.affiliation).toEqual('Test University of Testing');
	});

	it('destroys collection attributions', async () => {
		const { admin, community } = testCommunity;
		const ca = await createCollectionAttribution({
			order: 0,
			name: 'Test Person',
			communityId: community.id,
			collectionId: collection.id,
		});
		const agent = await login(admin);
		await agent
			.delete('/api/collectionAttributions')
			.send({
				communityId: community.id,
				collectionId: collection.id,
				id: ca.id,
			})
			.expect(200);
		const caNow = await CollectionAttribution.findOne({ where: { id: ca.id } });
		expect(caNow).toEqual(null);
	});
});

teardown(afterAll);
