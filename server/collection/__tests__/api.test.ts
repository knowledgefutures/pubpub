import { setup, teardown, login, modelize, expectCreatedActivityItem } from 'stubstub';
import { createCollection } from '../queries';
import { Collection } from '../../models';

const models = modelize`
	Community community {
		Member {
			permissions: "admin"
			User admin {}
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
	).toMatchObject((response) => ({
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

it('does not allow normal users to create a collection', async () => {
	const { community, guest } = models;
	const agent = await login(guest);
	await agent
		.post('/api/collections')
		.send({
			communityId: community.id,
			title: 'My test collection',
			kind: 'issue',
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
	).toMatchObject({ kind: 'collection-removed', collectionId: collection.id, actorId: admin.id });
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
	expect(collectionNow.id).toEqual(collection.id);
});

teardown(afterAll);
