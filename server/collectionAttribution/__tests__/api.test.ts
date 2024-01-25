import { Op } from 'sequelize';
import { setup, teardown, login, modelize } from 'stubstub';
import { CollectionAttribution } from 'server/models';

import { createCollectionAttribution } from '../queries';

const models = modelize`
	Community community {
		Member {
			permissions: "admin"
			User communityAdmin {}
		}
		Collection collection {
			title: "Some collection"
			kind: "book"
			Member {
				permissions: "manage"
				User collectionManager {}
			}
			Member {
				permissions: "edit"
				User collectionEditor {}
			}
			CollectionAttribution {
				name: "Suspicious guy"
				order: 0
			}
		}
		Collection queryCollection {
			title: "Query test"
			CollectionAttribution ingrid {
				name: "Ingrid"
				order: 0.33
			}
			CollectionAttribution {
				name: "Hmmmm"
				order: 0.1
			}
			CollectionAttribution {
				name: "Henk"
				order: 0.25
			}
		}
	}
	User author {}
	Community anotherCommunity {
		Collection anotherCollection {
			title: "Another collection"
			CollectionAttribution ea {
				name: "Ea"
				order: 0.5
			}
		}
	}
`;

setup(beforeAll, async () => {
	await models.resolve();
});

describe('/api/collectionAttributions', () => {
	it('creates a collection attribution', async () => {
		const { collectionManager, community, collection } = models;
		const agent = await login(collectionManager);
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

	it('creates a collection attribution associated to a user, but fails to add both a name and a userid at once', async () => {
		const { collectionManager, community, collection, author } = models;
		const agent = await login(collectionManager);
		await agent
			.post('/api/collectionAttributions')
			.send({
				order: 0,
				name: 'Test Person',
				communityId: community.id,
				collectionId: collection.id,
				userId: author.id,
			})
			.expect(400);

		const { body: attr } = await agent
			.post('/api/collectionAttributions')
			.send({
				order: 0,

				communityId: community.id,
				collectionId: collection.id,
				userId: author.id,
			})
			.expect(201);

		expect(attr.user.id).toEqual(author.id);
	});

	// Thomas: Added this test bc this was possible in the past and would break the ui
	it('fails to add a non-string array of roles', async () => {
		const { collectionManager, community, collection, author } = models;

		const agent = await login(collectionManager);

		await agent
			.post('/api/collectionAttributions')
			.send({
				order: 0,
				communityId: community.id,
				collectionId: collection.id,
				userId: author.id,
				roles: 'Editor',
			})
			.expect(400);
	});

	it('does not create a collection attribution if you do not have appropriate permissions', async () => {
		const { community, collection, collectionEditor } = models;
		const agent = await login(collectionEditor);
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
		const { collectionManager, community, collection } = models;
		const ca = await createCollectionAttribution({
			order: 0,
			name: 'Test Person',
			//	communityId: community.id,
			collectionId: collection.id,
		});
		const agent = await login(collectionManager);
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
		const { collectionManager, community, collection } = models;
		const ca = await createCollectionAttribution({
			order: 0,
			name: 'Test Person',
			//	communityId: community.id,
			collectionId: collection.id,
		});
		const agent = await login(collectionManager);
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

	it('batch creates collection attributions', async () => {
		const { collectionManager, community, collection } = models;
		const agent = await login(collectionManager);

		const { body: attr } = await agent
			.post('/api/collectionAttributions/batch')
			.send({
				collectionId: collection.id,
				communityId: community.id,
				attributions: [
					{
						order: 0,
						name: 'Joanna',
					},
					{
						order: 0.5,
						name: 'Irene',
					},
				],
			})
			.expect(201);

		expect(attr.length).toEqual(2);

		const attributions = await CollectionAttribution.findAll({
			where: {
				collectionId: collection.id,
				[Op.or]: [{ name: 'Joanna' }, { name: 'Irene' }],
			},
		});

		expect(attributions.length).toEqual(2);
	});
});

const getHost = (community: any) => `${community.subdomain}.pubpub.org`;

let adminAgent: Awaited<ReturnType<typeof login>>;

describe('GET /api/collectionAttributions', () => {
	beforeEach(async () => {
		adminAgent = await login(models.communityAdmin);
		adminAgent.set('Host', getHost(models.community));
	});

	it('should allow you to query collectionAttributions of your own community', async () => {
		const { body: collectionAttributions } = await adminAgent
			.get(`/api/collectionAttributions`)
			.expect(200);

		expect(collectionAttributions.length).toBeGreaterThanOrEqual(3);
	});

	it('should allow you to query collectionAttributions of a collection in your community', async () => {
		const { queryCollection } = models;
		const { body: collectionAttributions } = await adminAgent
			.get(`/api/collectionAttributions?collectionId=${queryCollection.id}`)
			.expect(200);

		expect(collectionAttributions.length).toBeGreaterThanOrEqual(2);
	});

	it('should not allow you to query collectionAttributions of a collection in another community', async () => {
		const { anotherCollection } = models;
		const { body: collectionAttributions } = await adminAgent
			.get(`/api/collectionAttributions?collectionId=${anotherCollection.id}`)
			.expect(200);

		expect(collectionAttributions).toEqual([]);

		const { body: collectionAttributionsDifferentSyntax } = await adminAgent
			.get(
				`/api/collectionAttributions?filter=${encodeURIComponent(
					JSON.stringify({ collectionId: [anotherCollection.id] }),
				)}`,
			)
			.expect(200);

		expect(collectionAttributionsDifferentSyntax).toEqual([]);
	});

	it('should allow you to query collectionAttributions of multiple collections', async () => {
		const { collection, queryCollection } = models;

		const { body: collectionAttributions } = await adminAgent
			.get(
				`/api/collectionAttributions?collectionId=${encodeURIComponent(
					JSON.stringify([collection.id, queryCollection.id]),
				)}&limit=100`,
			)
			.expect(200);

		expect(collectionAttributions.length).toBeGreaterThan(2);
	});

	it('should let you get a collection by id', async () => {
		const { ingrid } = models;
		const { body: collectionAttribution } = await adminAgent
			.get(`/api/collectionAttributions/${ingrid.id}`)
			.expect(200);

		expect(collectionAttribution.id).toEqual(ingrid.id);
	});

	it('GET /api/collectionAttributions?id=<id> and GET /api/collectionAttributions/<id> should return the same', async () => {
		const { ingrid } = models;

		const { body: collectionAttribution1 } = await adminAgent
			.get(`/api/collectionAttributions/${ingrid.id}`)
			.expect(200);

		const { body: collectionAttribution2 } = await adminAgent

			.get(`/api/collectionAttributions?id=${ingrid.id}`)
			.expect(200);

		expect(collectionAttribution1).toEqual(collectionAttribution2[0]);
	});

	it('should not allow you to query collectionAttributions from other communities if you know their id or name', async () => {
		const { ea } = models;

		await adminAgent.get(`/api/collectionAttributions/${ea.id}`).expect(404);

		const eas = await adminAgent.get(`/api/collectionAttributions?name=ea`).expect(200);

		expect(eas.body).toEqual([]);
	});

	it('should allow you to get all collectionAttributions from ingrid', async () => {
		const { body: collectionAttributions } = await adminAgent
			.get(`/api/collectionAttributions?name=Ingrid`)
			.expect(200);

		expect(collectionAttributions.length).toEqual(1);
	});

	it('can sort ascending by order', async () => {
		const { queryCollection } = models;

		const { body: unsorted } = await adminAgent
			.get(
				`/api/collectionAttributions?collectionId=${queryCollection.id}&orderBy=DESC&sortBy=order`,
			)
			.expect(200);

		const unsortedOrder = unsorted.map((attr: any) => attr.order);

		expect(unsortedOrder).not.toEqual(structuredClone(unsortedOrder).sort());
		const { body: collectionAttributions } = await adminAgent
			.get(
				`/api/collectionAttributions?collectionId=${queryCollection.id}&orderBy=ASC&sortBy=order`,
			)
			.expect(200);

		const sortedOrder = collectionAttributions.map((attr: any) => attr.order);

		expect(sortedOrder).toEqual(structuredClone(unsortedOrder).sort());
	});
});

teardown(afterAll);
