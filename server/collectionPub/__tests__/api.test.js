/* global describe, it, expect, beforeAll, afterAll */
import { makeUser, makeCommunity, setup, teardown, login } from '../../../stubstub';
import { createCollection } from '../../collection/queries';
import { Collection, CollectionPub } from '../../models';
import { createPub } from '../../pub/queries';
import { createCollectionPub } from '../queries';

let user;
let testCommunity;
let anotherTestCommunity;
let tag;
let issue;
let book;
let pub;
let anotherPub;

setup(beforeAll, async () => {
	user = await makeUser();
	testCommunity = await makeCommunity();
	anotherTestCommunity = await makeCommunity();
	tag = await createCollection({
		communityId: testCommunity.community.id,
		kind: 'tag',
		title: 'Just a test tag',
	});
	issue = await createCollection({
		communityId: testCommunity.community.id,
		kind: 'issue',
		title: 'Just a test issue',
	});
	book = await createCollection({
		communityId: testCommunity.community.id,
		kind: 'book',
		title: 'Just a test book',
	});
	pub = await createPub({ communityId: testCommunity.community.id }, user);
	anotherPub = await createPub({ communityId: testCommunity.community.id }, user);
});

describe('/api/collectionPubs', () => {
	it('creates a collectionPub and sets its rank', async () => {
		const { admin, community } = testCommunity;
		const agent = await login(admin);
		const { body: collectionPub } = await agent
			.post('/api/collectionPubs')
			.send({ pubId: pub.id, collectionId: issue.id, communityId: community.id })
			.expect(201);
		const queriedCollectionPub = await CollectionPub.findOne({
			where: { id: collectionPub.id },
		});
		expect(queriedCollectionPub.collectionId).toEqual(issue.id);
		expect(queriedCollectionPub.rank).toEqual('h');
	});

	it('does not let administrators of other communities create a collectionPub', async () => {
		const { community } = testCommunity;
		const { admin: anotherAdmin } = anotherTestCommunity;
		const agent = await login(anotherAdmin);
		await agent
			.post('/api/collectionPubs')
			.send({ pubId: pub.id, collectionId: issue.id, communityId: community.id })
			.expect(403);
	});

	it('handles ranks correctly', async () => {
		const { community, admin } = testCommunity;
		await CollectionPub.destroy({ where: { collectionId: issue.id } });
		const agent = await login(admin);
		// Add the pub to the issue
		const { body: firstCollectionPub } = await agent
			.post('/api/collectionPubs')
			.send({ pubId: pub.id, collectionId: issue.id, communityId: community.id })
			.expect(201);
		expect(firstCollectionPub.rank).toEqual('h');
		// Add another pub to the issue
		const { body: secondCollectionPub } = await agent
			.post('/api/collectionPubs')
			.send({ pubId: anotherPub.id, collectionId: issue.id, communityId: community.id })
			.expect(201);
		expect(secondCollectionPub.rank).toEqual('q');
	});

	it('makes a non-tag collectionPub primary when it is the first non-tag collection for a pub', async () => {
		const { community, admin } = testCommunity;
		await CollectionPub.destroy({ where: { pubId: pub.id } });
		const agent = await login(admin);
		// Add the pub to a tag
		await agent
			.post('/api/collectionPubs')
			.send({ pubId: pub.id, collectionId: tag.id, communityId: community.id })
			.expect(201);
		// Add the pub to a book
		const { body: collectionPub } = await agent
			.post('/api/collectionPubs')
			.send({ pubId: pub.id, collectionId: book.id, communityId: community.id })
			.expect(201);
		expect(collectionPub.isPrimary).toEqual(true);
	});

	it('does not make a collectionPub primary when there is already a primary collection', async () => {
		const { community, admin } = testCommunity;
		await CollectionPub.destroy({ where: { pubId: pub.id } });
		const agent = await login(admin);
		// Add the pub to an issue
		const { body: firstCollectionPub } = await agent
			.post('/api/collectionPubs')
			.send({ pubId: pub.id, collectionId: issue.id, communityId: community.id })
			.expect(201);
		expect(firstCollectionPub.isPrimary).toEqual(true);
		// Add the pub to a book
		const { body: secondCollectionPub } = await agent
			.post('/api/collectionPubs')
			.send({ pubId: pub.id, collectionId: book.id, communityId: community.id })
			.expect(201);
		expect(secondCollectionPub.isPrimary).toEqual(false);
	});

	it('does not set a private collection as a primary collection', async () => {
		const { community, admin } = testCommunity;
		// Make the book private for a bit
		await Collection.update({ isPublic: false }, { where: { id: book.id } });
		await CollectionPub.destroy({ where: { pubId: pub.id } });
		const agent = await login(admin);
		// Add the pub to a book
		const { body: collectionPub } = await agent
			.post('/api/collectionPubs')
			.send({ pubId: pub.id, collectionId: book.id, communityId: community.id })
			.expect(201);
		// Should be false because the book is private
		expect(collectionPub.isPrimary).toEqual(false);
		await Collection.update({ isPublic: true }, { where: { id: book.id } });
	});

	it('sets a collectionPub to be the primary collection for a pub', async () => {
		const { admin, community } = testCommunity;
		await CollectionPub.destroy({ where: { pubId: pub.id } });
		const first = await createCollectionPub({ pubId: pub.id, collectionId: issue.id });
		const second = await createCollectionPub({ pubId: pub.id, collectionId: book.id });
		expect(first.isPrimary).toEqual(true);
		expect(second.isPrimary).toEqual(false);
		const agent = await login(admin);
		await agent
			.put('/api/collectionPubs/setPrimary')
			.send({
				id: second.id,
				collectionId: book.id,
				isPrimary: true,
				pubId: pub.id,
				communityId: community.id,
			})
			.expect(200);
		const firstAgain = await CollectionPub.findOne({ where: { id: first.id } });
		const secondAgain = await CollectionPub.findOne({ where: { id: second.id } });
		expect(secondAgain.isPrimary).toEqual(true);
		expect(firstAgain.isPrimary).toEqual(false);
		await agent
			.put('/api/collectionPubs/setPrimary')
			.send({
				id: second.id,
				collectionId: book.id,
				isPrimary: false,
				pubId: pub.id,
				communityId: community.id,
			})
			.expect(200);
		const firstAgainAgain = await CollectionPub.findOne({ where: { id: first.id } });
		const secondAgainAgain = await CollectionPub.findOne({ where: { id: second.id } });
		expect(firstAgainAgain.isPrimary).toEqual(false);
		expect(secondAgainAgain.isPrimary).toEqual(false);
	});

	it('updates reasonable values on a pubCollection', async () => {
		const { admin, community } = testCommunity;
		await CollectionPub.destroy({ where: { pubId: pub.id } });
		const collectionPub = await createCollectionPub({ pubId: pub.id, collectionId: issue.id });
		const agent = await login(admin);
		await agent
			.put('/api/collectionPubs')
			.send({
				id: collectionPub.id,
				collectionId: issue.id,
				communityId: community.id,
				pubId: pub.id,
				rank: 'zzz',
				contextHint: 'boo',
			})
			.expect(200);
		const resultingCollectionPub = await CollectionPub.findOne({
			where: { id: collectionPub.id },
		});
		expect(resultingCollectionPub.rank).toEqual('zzz');
		expect(resultingCollectionPub.contextHint).toEqual('boo');
	});

	it('deletes a pubCollection', async () => {
		const { admin, community } = testCommunity;
		await CollectionPub.destroy({ where: { pubId: pub.id } });
		const collectionPub = await createCollectionPub({ pubId: pub.id, collectionId: issue.id });
		const agent = await login(admin);
		await agent
			.delete('/api/collectionPubs')
			.send({
				id: collectionPub.id,
				collectionId: issue.id,
				pubId: pub.id,
				communityId: community.id,
			})
			.expect(200);
		const deletedCollectionPub = await CollectionPub.findOne({
			where: { id: collectionPub.id },
		});
		expect(deletedCollectionPub).toEqual(null);
	});
});

teardown(afterAll);
