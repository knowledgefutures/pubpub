/* global it, expect, beforeAll, afterAll */
import { setup, teardown, login, modelize } from 'stubstub';
import { createCollection } from '../queries';
import { Collection, CollectionPub } from '../../models';
import { createCollectionPub } from '../../collectionPub/queries';

const models = modelize`
	Community community {
		Member {
			permissions: "admin"
			User admin {}
		}
		Pub pub {
			Member {
				permissions: "admin"
				User pubAdmin {}
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

it('creates a new collection', async () => {
	const { admin, community } = models;
	const agent = await login(admin);
	const {
		body: { communityId, title, kind, isPublic },
	} = await agent
		.post('/api/collections')
		.send({
			communityId: community.id,
			title: 'My test collection',
			kind: 'issue',
		})
		.expect(201);
	expect(communityId).toEqual(community.id);
	expect(title).toEqual('My test collection');
	expect(kind).toEqual('issue');
	expect(isPublic).toEqual(false);
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
	const { body: updatedCollection } = await agent
		.put('/api/collections')
		.send({
			id: collection.id,
			title: 'The Updated Book of Tests',
			communityId: community.id,
			doi: 'dont_change_me_lol',
		})
		.expect(200);
	expect(updatedCollection.title).toEqual('The Updated Book of Tests');
	expect(updatedCollection.doi).not.toEqual('dont_change_me_lol');
});

it('unsets a collectionPub as primary when its collection is made private', async () => {
	const { admin, community, pub } = models;
	const issue = await createCollection({
		communityId: community.id,
		kind: 'issue',
		title: 'The Book of Tests',
	});
	await Collection.update({ isPublic: true }, { where: { id: issue.id } });
	const collectionPub = await createCollectionPub({ pubId: pub.id, collectionId: issue.id });
	expect(collectionPub.isPrimary).toEqual(true);
	const agent = await login(admin);
	await agent
		.put('/api/collections')
		.send({
			id: issue.id,
			communityId: community.id,
			isPublic: false,
		})
		.expect(200);
	const collectionPubAgain = await CollectionPub.findOne({ where: { id: collectionPub.id } });
	expect(collectionPubAgain.isPrimary).toEqual(false);
});

it('deletes an existing collection with appropriate permissions', async () => {
	const { admin, community } = models;
	const collection = await createCollection({
		communityId: community.id,
		kind: 'issue',
		title: 'The Book of Tests',
	});
	const agent = await login(admin);
	await agent
		.delete('/api/collections')
		.send({ id: collection.id, communityId: community.id })
		.expect(200);
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
