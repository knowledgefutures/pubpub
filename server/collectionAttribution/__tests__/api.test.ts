/* global it, expect, beforeAll, afterAll */
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
		}
	}
	User author {}
`;

setup(beforeAll, async () => {
	await models.resolve();
});

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

it('creates a collection attribution associated to a user', async () => {
	const { collectionManager, community, collection, author } = models;
	const agent = await login(collectionManager);
	const { body: attr } = await agent
		.post('/api/collectionAttributions')
		.send({
			order: 0,
			name: 'Test Person',
			communityId: community.id,
			collectionId: collection.id,
			userId: author.id,
		})
		.expect(201);
	expect(attr.user.id).toEqual(author.id);
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
		communityId: community.id,
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
		communityId: community.id,
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

teardown(afterAll);
