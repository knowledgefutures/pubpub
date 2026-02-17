import { expectCreatedActivityItem, login, modelize, setup, teardown } from 'stubstub';
import { collectionSchema, type GetManyCollectionQuery } from 'utils/api/schemas/collection';

import { Collection } from '../../models';
import { createCollection } from '../queries';

const models = modelize`
	Community community {
		Member {
			permissions: "admin"
			User admin {}
		}
		Member {
			permissions: "view"
			User nonAdmin {}
		}
		Page {
			title: "I'm a page"
			slug: "i-am-a-page"
		}
		Pub pub {
			Member {
				permissions: "admin"
				User pubAdmin {}
			}
		}
		Collection {
			title: "I exist"
			kind: "book"
			slug: "i-exist"
		}
		Collection slugCollection {
			title: "I exist too"
			kind: "book"
			slug: "i-exist-too"
		}
		Collection {
			title: "The Enigmatic Cosmos"
			kind: "book"
			slug: "the-enigmatic-cosmos"
		}
		Collection ancientScripts {
			title: "Ancient Scripts and Codes"
			kind: "issue"
			slug: "ancient-scripts"
		}
		Collection techConference2023 {
			title: "Tech Innovations 2023"
			kind: "conference"
			slug: "tech-innovations-2023"
		}
		Collection {
			title: "Mysteries of the Deep Ocean"
			kind: "book"
			slug: "deep-ocean-mysteries"
		}
		Collection tagAI {
			title: "Artificial Intelligence Breakthroughs"
			kind: "tag"
			slug: "ai-breakthroughs"
		}
		Collection {
			title: "Exploring Quantum Realities"
			kind: "issue"
			slug: "quantum-realities"
		}
		Collection confCyberSec {
			title: "Cybersecurity Conference 2023"
			kind: "conference"
			slug: "cybersecurity-2023"
		}
		Collection {
			title: "The Art of Cryptography"
			kind: "book"
			slug: "art-of-cryptography"
			metadata: '{"doi":"10.21428/3f857d3b.1e2a4b3e"}'
		}
		Collection tagSpaceExploration {
			title: "Space Exploration Milestones"
			kind: "tag"
			slug: "space-milestones"
		}
		Collection {
			title: "Historical Epochs"
			kind: "issue"
			slug: "historical-epochs"
			CollectionAttribution {
				name: "John Schmoe"
			}
		}
	}
	Community anotherCommunity {
		Member {
			permissions: "admin"
			User anotherAdmin {}
		}
		Collection {
			title: "AAAAA"
			kind: "issue"
			slug: "aaaaa"
		}
	}
	User guest {}
`;

setup(beforeAll, async () => {
	await models.resolve();
});

const getHost = (community) => `${community.subdomain}.pubpub.org`;

it('creates a new collection', async () => {
	const { admin, community } = models;
	const agent = await login(admin);
	const {
		body: { communityId, title, kind, isPublic, isRestricted, layout },
	} = await expectCreatedActivityItem(
		agent
			.post('/api/collections')
			.send({
				communityId: community.id,
				title: 'My test collection',
				kind: 'issue',
			})
			.expect(201),
	).toMatchResultingObject((response) => ({
		kind: 'collection-created',
		collectionId: response.body.id,
		actorId: admin.id,
	}));
	expect(communityId).toEqual(community.id);
	expect(title).toEqual('My test collection');
	expect(kind).toEqual('issue');
	expect(layout.blocks.length).toEqual(2);
	expect(isPublic).toEqual(false);
	expect(isRestricted).toEqual(true);
});

it('does not create a collection with the slug of another collection or a page', async () => {
	const { admin, community } = models;
	const agent = await login(admin);

	const {
		body: { slug: firstSlug },
	} = await agent
		.post('/api/collections')
		.send({
			communityId: community.id,
			title: 'Another collection',
			slug: 'i-exist',
			kind: 'issue',
		})
		.expect(201);
	expect(firstSlug).toEqual('i-exist-2');

	const {
		body: { slug: secondSlug },
	} = await agent
		.post('/api/collections')
		.send({
			communityId: community.id,
			title: 'Another collection',
			slug: 'i-am-a-page',
			kind: 'issue',
		})
		.expect(201);
	expect(secondSlug).toEqual('i-am-a-page-2');
});

it('does not allow admins of another community to create a collection', async () => {
	const { community, anotherAdmin } = models;
	const agent = await login(anotherAdmin);
	await agent
		.post('/api/collections')
		.send({
			communityId: community.id,
			title: 'My test collection',
			kind: 'issue',
		})
		.expect(403);
});

it('does not allow normal users to create or update a collection', async () => {
	const { community, guest, slugCollection } = models;
	const agent = await login(guest);
	await agent
		.post('/api/collections')
		.send({
			communityId: community.id,
			title: 'My test collection',
			kind: 'issue',
		})
		.expect(403);

	await agent
		.put('/api/collections')
		.send({
			communityId: community.id,
			id: slugCollection.id,
			title: 'My test collection',
		})
		.expect(403);
});

it('does not allow (mere) pub admins to add their pubs to a collection', async () => {
	const { community, pubAdmin } = models;
	const agent = await login(pubAdmin);
	await agent
		.post('/api/collections')
		.send({
			communityId: community.id,
			title: 'My test collection',
			kind: 'issue',
		})
		.expect(403);
});

it('updates only expected values on an existing collection', async () => {
	const { admin, community } = models;
	const collection = await createCollection({
		communityId: community.id,
		kind: 'issue',
		title: 'The Book of Tests',
	});
	const agent = await login(admin);
	const { body: updatedCollection } = await expectCreatedActivityItem(
		agent
			.put('/api/collections')
			.send({
				id: collection.id,
				title: 'The Updated Book of Tests',
				communityId: community.id,
				slug: 'the-updated-book-of-tests',
				doi: 'dont_change_me_lol',
			})
			.expect(200),
	).toMatchObject({
		kind: 'collection-updated',
		collectionId: collection.id,
		actorId: admin.id,
		payload: { title: { from: 'The Book of Tests', to: 'The Updated Book of Tests' } },
	});
	expect(updatedCollection.title).toEqual('The Updated Book of Tests');
	expect(updatedCollection.slug).toEqual('the-updated-book-of-tests');
	expect(updatedCollection.doi).not.toEqual('dont_change_me_lol');
});

it('will not assign a slug belonging to another collection', async () => {
	const { admin, community, slugCollection } = models;
	const agent = await login(admin);

	const {
		body: { type, slugStatus },
	} = await agent
		.put('/api/collections')
		.send({
			id: slugCollection.id,
			communityId: community.id,
			slug: 'i-exist',
		})
		.expect(400);
	expect(type).toEqual('forbidden-slug');
	expect(slugStatus).toEqual('used');
});

it('will not assign a slug belonging to a Page', async () => {
	const { admin, community, slugCollection } = models;
	const agent = await login(admin);

	const {
		body: { type, slugStatus },
	} = await agent
		.put('/api/collections')
		.send({
			id: slugCollection.id,
			communityId: community.id,
			slug: 'i-am-a-page',
		})
		.expect(400);
	expect(type).toEqual('forbidden-slug');
	expect(slugStatus).toEqual('used');
});

it('deletes an existing collection with appropriate permissions', async () => {
	const { admin, community } = models;
	const collection = await createCollection({
		communityId: community.id,
		kind: 'issue',
		title: 'The Book of Tests',
	});
	const agent = await login(admin);
	await expectCreatedActivityItem(
		agent
			.delete('/api/collections')
			.send({ id: collection.id, communityId: community.id })
			.expect(200),
	).toMatchObject({
		kind: 'collection-removed',
		collectionId: collection.id,
		actorId: admin.id,
	});
	const collectionNow = await Collection.findOne({ where: { id: collection.id } });
	expect(collectionNow).toEqual(null);
});

it('does not allow normal users to delete a collection', async () => {
	const { community, guest } = models;
	const collection = await createCollection({
		communityId: community.id,
		kind: 'issue',
		title: 'The Book of Tests',
	});
	const agent = await login(guest);
	await agent
		.delete('/api/collections')
		.send({ id: collection.id, communityId: community.id })
		.expect(403);
	const collectionNow = await Collection.findOne({ where: { id: collection.id } });
	expect(collectionNow?.id).toEqual(collection.id);
});

describe('GET /api/collections', () => {
	it('should get a collection by id', async () => {
		const { confCyberSec, admin, community } = models;

		const agent = await login(admin);

		const { body } = await agent
			.get(`/api/collections/${confCyberSec.id}`)
			.set('Host', getHost(community))
			.expect(200);

		expect(body.title).toEqual(confCyberSec.title);
	});

	it('should get a collection by slug', async () => {
		const { confCyberSec, admin, community } = models;

		const agent = await login(admin);

		const { body } = await agent
			.get(`/api/collections/${confCyberSec.slug}`)
			.set('Host', getHost(community))
			.expect(200);

		expect(body.title).toEqual(confCyberSec.title);
	});

	it('should be able to include the community in the get response, but not do so by default', async () => {
		const { confCyberSec, admin, community } = models;

		const agent = await login(admin);

		const { body } = await agent
			.get(`/api/collections/${confCyberSec.id}`)
			.set('Host', getHost(community))
			.expect(200);

		expect(body.community).toBeUndefined();

		const { body: bodyWithCommunity } = await agent
			.get(`/api/collections/${confCyberSec.id}?include=${JSON.stringify(['community'])}`)
			.set('Host', getHost(community))
			.expect(200);

		expect(bodyWithCommunity.community).toBeDefined();
		expect(bodyWithCommunity.community.id).toEqual(community.id);
	});

	it('should throw a ForbiddenError for non-admin users', async () => {
		const { nonAdmin, community } = models;
		const agent = await login(nonAdmin);

		await agent.get('/api/collections').set('Host', getHost(community)).expect(403); // Forbidden
	});

	it('should not return collections from other communities', async () => {
		const { anotherAdmin, anotherCommunity } = models;
		const agent = await login(anotherAdmin);

		const { body } = await agent
			.get('/api/collections')
			.set('Host', getHost(anotherCommunity))
			.expect(200);

		expect(body).toBeInstanceOf(Array);
		expect(body.length).toEqual(1);
	});

	it('should return collections with default query parameters', async () => {
		const { admin, community } = models;
		const agent = await login(admin);

		const { body } = await agent
			.get('/api/collections')
			.set('Host', getHost(community))
			.expect(200);

		expect(body).toBeInstanceOf(Array);
		expect(body.length).toBeLessThanOrEqual(10); // default limit
		expect(body.length).toBeGreaterThanOrEqual(1);
		// Additional assertions based on default sort, order, etc.
	});

	it('should return collections with custom query parameters', async () => {
		const { admin, community } = models;
		const agent = await login(admin);

		const { body } = await agent
			.get('/api/collections?limit=5&offset=5&sortBy=updatedAt&orderBy=ASC')
			.set('Host', getHost(community))
			.expect(200);

		expect(body).toBeInstanceOf(Array);
		expect(body.length).toBeLessThanOrEqual(5);
		// Additional assertions based on custom sort, order, etc.
	});

	it('should return collections with a specific title', async () => {
		const { admin, community } = models;
		const agent = await login(admin);

		const { body } = await agent
			.get(
				`/api/collections?filter=${encodeURIComponent(
					JSON.stringify({ title: { contains: 'crypto' } }),
				)}`,
			)
			.set('Host', getHost(community))
			.expect(200);

		expect(body).toBeInstanceOf(Array);
		expect(body.length).toBeGreaterThanOrEqual(1);
		body.forEach((collection) => {
			expect(collection.title).toBe('The Art of Cryptography');
		});
	});
	// FIXME: flaky
	it.skip('should return collections with specified includes', async () => {
		const { admin, community } = models;
		const agent = await login(admin);

		const { body } = await agent
			.get('/api/collections?include[]=attributions&include[]=members')
			.set('Host', getHost(community))
			.expect(200);

		expect(body).toBeInstanceOf(Array);
		expect(body.length).toBeGreaterThanOrEqual(1);
		body.forEach((collection) => {
			expect(collection).toHaveProperty('attributions');
			expect(collection).toHaveProperty('members');
			expect(collection).not.toHaveProperty('pubs');
			expect(collection).not.toHaveProperty('page');
		});

		const historicEpoch = body.find((collection) => collection.title === 'Historical Epochs');

		expect(historicEpoch).toHaveProperty('attributions');
		expect(historicEpoch.attributions[0].name).toBe('John Schmoe');
	});
	it('should return collections that match the expected schema', async () => {
		const { admin, community } = models;
		const agent = await login(admin);

		const { body } = await agent
			.get('/api/collections')
			.set('Host', getHost(community))
			.expect(200);

		body.forEach((collection) => {
			expect(() => collectionSchema.parse(collection)).not.toThrow();
		});
	});

	it('should order collections differently for different sort parameters', async () => {
		const { admin, community } = models;
		const agent = await login(admin);

		const { body: orderByTitle } = await agent
			.get('/api/collections?sortBy=title')
			.set('Host', getHost(community))
			.expect(200);

		const { body: orderByUpdatedAt } = await agent
			.get('/api/collections?sortBy=updatedAt')
			.set('Host', getHost(community))
			.expect(200);

		// Assuming IDs are unique and can be used to differentiate collections
		expect(orderByTitle[0].id).not.toEqual(orderByUpdatedAt[0].id);
	});

	it('should reverse the order of collections when changing sort order', async () => {
		const { admin, community } = models;
		const agent = await login(admin);

		const [{ body: orderAsc }, { body: orderDesc }] = await Promise.all([
			agent
				.get('/api/collections?sortBy=slug&orderBy=ASC&limit=100')
				.set('Host', getHost(community))
				.expect(200),

			agent
				.get('/api/collections?sortBy=slug&orderBy=DESC&limit=100')
				.set('Host', getHost(community))
				.expect(200),
		]);

		expect(orderAsc.length).toEqual(orderDesc.length);
		expect(orderAsc.at(0)).toEqual(orderDesc.at(-1));
		expect(orderAsc.at(1)).toEqual(orderDesc.at(-2));
	});

	it('should limit the number of collections returned', async () => {
		const { admin, community } = models;
		const agent = await login(admin);

		const limit = 5;

		const { body } = await agent
			.get(`/api/collections?limit=${limit}`)
			.set('Host', getHost(community))
			.expect(200);

		expect(body.length).toEqual(limit);
	});

	it('should return correct collections with offset and limit', async () => {
		const { admin, community } = models;
		const agent = await login(admin);

		const limit = 5;
		const offset = 5;

		const { body: firstPage } = await agent
			.get(`/api/collections?limit=${limit}&offset=${offset}`)
			.set('Host', getHost(community))
			.expect(200);

		const { body: secondPage } = await agent
			.get(`/api/collections?limit=${limit}&offset=${offset + limit}`)
			.set('Host', getHost(community))
			.expect(200);

		// Ensure no overlap in collections between pages
		const firstPageIds = firstPage.map((c) => c.id);
		const secondPageIds = secondPage.map((c) => c.id);
		const intersection = firstPageIds.filter((id) => secondPageIds.includes(id));

		expect(intersection.length).toEqual(0);
	});

	it('should do some sophisticated filtering', async () => {
		const { admin, community } = models;

		const agent = await login(admin);

		const filter = {
			kind: ['book', 'conference'],
			title: [{ contains: 'the' }],
			metadata: {
				doi: [{ contains: '10.21428' }],
			},
		} satisfies NonNullable<GetManyCollectionQuery>['filter'];

		const { body } = await agent
			.get(`/api/collections?filter=${encodeURIComponent(JSON.stringify(filter))}`)
			.set('Host', getHost(community))
			.expect(200);

		body[0]?.metadata?.doi?.startsWith('10.21428');
	});
});

teardown(afterAll);
