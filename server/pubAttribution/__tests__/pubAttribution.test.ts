import { Op } from 'sequelize';
import { login, modelize, setup, teardown } from 'stubstub';

import { PubAttribution, UserSubscription } from 'server/models';

import { createPubAttribution } from '../queries';

const models = modelize`
    User willBeSubscribed {
        UserNotificationPreferences {
            subscribeToPubsAsContributor: true
        }
    }
    User willNotBeSubscribed {
        UserNotificationPreferences {
            subscribeToPubsAsContributor: false
        }
    }
    Community community {
		Member {
			permissions: "admin"
			User communityAdmin {}
		}
        Pub pub {
			title: "Some pub"
			Member {
				permissions: "manage"
				User pubManager {}
			}
			Member {
				permissions: "edit"
				User pubEditor {}
			}
		}
		Pub queryPub {
			title: "Query test"
			PubAttribution ingrid {
				name: "Ingrid"
				order: 0.33
			}
			PubAttribution {
				name: "Henk"
				order: 0.25
			}
		}
    }
	User author {}
	Community anotherCommunity {
		Pub anotherPub {
			title: "Another pub"
			PubAttribution ea {
				name: "Ea"
				order: 0.5
			}
		}
	}
`;

setup(beforeAll, models.resolve);
teardown(afterAll);

describe('createPubAttribution()', () => {
	it("subscribes a user to a Pub's threads when they are added as a contributor, according to their notification preferences", async () => {
		const { willBeSubscribed, willNotBeSubscribed, pub } = models;
		await Promise.all(
			(
				[
					[willBeSubscribed, 1],
					[willNotBeSubscribed, 0],
				] as const
			).map(async ([user, count]) => {
				await createPubAttribution({
					userId: user.id,
					pubId: pub.id,
					name: null,
					order: count,
					isAuthor: false,
				});
				expect(
					await UserSubscription.count({ where: { userId: user.id, pubId: pub.id } }),
				).toEqual(count);
			}),
		);
	});

	it('creates a very complete pub attribution', async () => {
		const { pubManager, community, pub } = models;
		const agent = await login(pubManager);
		const { body: attr } = await agent
			.post('/api/pubAttributions')
			.send({
				order: 0,
				name: 'Test Person',
				communityId: community.id,
				pubId: pub.id,
				orcid: '0000-0000-0000-0000',
				roles: ['Fake role', 'Original Draft Preparation'],
				affiliation: 'Test University of Testing',
			})
			.expect(201);

		expect(attr).toMatchObject({
			name: 'Test Person',
			orcid: '0000-0000-0000-0000',
			roles: ['Fake role', 'Original Draft Preparation'],
			affiliation: 'Test University of Testing',
		});
	});

	it('creates a pub attribution associated to a user, but fails to add both a name and a userid at once', async () => {
		const { pubManager, community, pub, author } = models;
		const agent = await login(pubManager);
		await agent
			.post('/api/pubAttributions')
			.send({
				order: 0,
				name: 'Test Person',
				communityId: community.id,
				pubId: pub.id,
				userId: author.id,
			})
			.expect(400);

		const { body: attr } = await agent
			.post('/api/pubAttributions')
			.send({
				order: 0,

				communityId: community.id,
				pubId: pub.id,
				userId: author.id,
			})
			.expect(201);

		expect(attr.user.id).toEqual(author.id);
	});

	// Thomas: Added this test bc this was possible in the past and would break the ui
	it('fails to add a non-string array of roles', async () => {
		const { pubManager, community, pub, author } = models;

		const agent = await login(pubManager);

		await agent
			.post('/api/pubAttributions')
			.send({
				order: 0,
				communityId: community.id,
				pubId: pub.id,
				userId: author.id,
				roles: 'Editor',
			})
			.expect(400);
	});

	it('does not create a pub attribution if you do not have appropriate permissions', async () => {
		const { community, pub, pubEditor } = models;
		const agent = await login(pubEditor);
		await agent
			.post('/api/pubAttributions')
			.send({
				order: 0,
				name: 'Some Schmoe',
				communityId: community.id,
				pubId: pub.id,
			})
			.expect(403);
	});

	it('updates pub attributions', async () => {
		const { pubManager, community, pub } = models;
		const ca = await createPubAttribution({
			order: 0,
			name: 'Test Person',
			//	communityId: community.id,
			pubId: pub.id,
		});
		const agent = await login(pubManager);
		const { body: attr } = await agent
			.put('/api/pubAttributions')
			.send({
				affiliation: 'Test University of Testing',
				communityId: community.id,
				pubId: pub.id,
				id: ca.id,
			})
			.expect(200);
		expect(attr.affiliation).toEqual('Test University of Testing');
	});

	it('destroys pub attributions', async () => {
		const { pubManager, community, pub } = models;
		const ca = await createPubAttribution({
			order: 0,
			name: 'Test Person',
			//	communityId: community.id,
			pubId: pub.id,
		});
		const agent = await login(pubManager);
		await agent
			.delete('/api/pubAttributions')
			.send({
				communityId: community.id,
				pubId: pub.id,
				id: ca.id,
			})
			.expect(200);
		const caNow = await PubAttribution.findOne({ where: { id: ca.id } });
		expect(caNow).toEqual(null);
	});

	it('batch creates pub attributions', async () => {
		const { pubManager, community, pub } = models;
		const agent = await login(pubManager);

		const { body: attr } = await agent
			.post('/api/pubAttributions/batch')
			.send({
				pubId: pub.id,
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

		const attributions = await PubAttribution.findAll({
			where: { pubId: pub.id, [Op.or]: [{ name: 'Joanna' }, { name: 'Irene' }] },
		});

		expect(attributions.length).toEqual(2);
	});
});

const getHost = (community: any) => `${community.subdomain}.pubpub.org`;

let adminAgent: Awaited<ReturnType<typeof login>>;

describe('GET /api/pubAttributions', () => {
	beforeEach(async () => {
		adminAgent = await login(models.communityAdmin);
		adminAgent.set('Host', getHost(models.community));
	});

	it('should allow you to query pubAttributions of your own community', async () => {
		const { body: pubAttributions } = await adminAgent.get(`/api/pubAttributions`).expect(200);

		expect(pubAttributions.length).toBeGreaterThanOrEqual(4);
	});

	it('should allow you to query pubAttributions of a pub in your community', async () => {
		const { queryPub } = models;
		const { body: pubAttributions } = await adminAgent
			.get(`/api/pubAttributions?pubId=${queryPub.id}`)
			.expect(200);

		expect(pubAttributions.length).toEqual(3); // 2 defined + 1 default
	});

	it('should not allow you to query pubAttributions of a pub in another community', async () => {
		const { anotherPub } = models;
		const { body: pubAttributions } = await adminAgent
			.get(`/api/pubAttributions?pubId=${anotherPub.id}`)
			.expect(200);

		expect(pubAttributions).toEqual([]);

		const { body: pubAttributionsDifferentSyntax } = await adminAgent
			.get(
				`/api/pubAttributions?filter=${encodeURIComponent(
					JSON.stringify({ pubId: [anotherPub.id] }),
				)}`,
			)
			.expect(200);

		expect(pubAttributionsDifferentSyntax).toEqual([]);
	});

	it('should allow you to query pubAttributions of multiple pubs', async () => {
		const { pub, queryPub } = models;

		const { body: pubAttributions } = await adminAgent
			.get(
				`/api/pubAttributions?pubId=${encodeURIComponent(
					JSON.stringify([pub.id, queryPub.id]),
				)}&limit=100`,
			)
			.expect(200);

		expect(pubAttributions.length).toBeGreaterThan(2);
	});

	it('should let you get a pub by id', async () => {
		const { ingrid } = models;
		const { body: pubAttribution } = await adminAgent
			.get(`/api/pubAttributions/${ingrid.id}`)
			.expect(200);

		expect(pubAttribution.id).toEqual(ingrid.id);
	});

	it('GET /api/pubAttributions?id=<id> and GET /api/pubAttributions/<id> should return the same', async () => {
		const { ingrid } = models;

		const { body: pubAttribution1 } = await adminAgent
			.get(`/api/pubAttributions/${ingrid.id}`)
			.expect(200);

		const { body: pubAttribution2 } = await adminAgent

			.get(`/api/pubAttributions?id=${ingrid.id}`)
			.expect(200);

		expect(pubAttribution1).toEqual(pubAttribution2[0]);
	});

	it('should not allow you to query pubAttributions from other communities if you know their id or name', async () => {
		const { ea } = models;

		await adminAgent.get(`/api/pubAttributions/${ea.id}`).expect(404);

		const eas = await adminAgent.get(`/api/pubAttributions?name=ea`).expect(200);

		expect(eas.body).toEqual([]);
	});

	it('should allow you to get all pubAttributions from ingrid', async () => {
		const { body: pubAttributions } = await adminAgent
			.get(`/api/pubAttributions?name=Ingrid`)
			.expect(200);

		expect(pubAttributions.length).toEqual(1);
	});

	it('can sort ascending by order', async () => {
		const { queryPub } = models;

		const { body: unsorted } = await adminAgent
			.get(`/api/pubAttributions?pubId=${queryPub.id}&orderBy=DESC&sortBy=order`)
			.expect(200);

		const unsortedOrder = unsorted.map((attr: any) => attr.order);

		expect(unsortedOrder).not.toEqual(structuredClone(unsortedOrder).sort());

		const { body: pubAttributions } = await adminAgent
			.get(`/api/pubAttributions?pubId=${queryPub.id}&orderBy=ASC&sortBy=order`)
			.expect(200);

		const sortedOrder = pubAttributions.map((attr: any) => attr.order);

		expect(sortedOrder).toEqual(structuredClone(unsortedOrder).sort());
	});
});
