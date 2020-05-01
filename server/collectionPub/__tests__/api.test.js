/* global it, expect, beforeAll, afterAll */
import { setup, teardown, login, modelize } from 'stubstub';
import { CollectionPub, Collection } from 'server/models';
import { createCollectionPub } from '../queries';

const models = modelize`
	Community community {
		Member {
			permissions: "admin"
			User admin { }
		}
		Pub pub {
			Member {
				permissions: "admin"
				User pubAdmin {}
			}
		}
		Pub anotherPub {}
		Pub pubToAdd {}
		Collection issue {
			title: "My test issue"
			kind: "issue"
			isPublic: true
			Member {
				permissions: "manage"
				User collectionManager {}
			}
		}
		Collection book {
			title: "Listen. I am a book."
			kind: "book"
			isPublic: true
		}
		Collection tag {
			title: "Just a tag innit"
			kind: "tag"
		}
		Collection hasPubs {
			Member {
				permissions: "view"
				User hasPubsMember {}
			}
			isPublic: true
			CollectionPub {
				rank: "a"
				Pub pub1 {
					Release {}
				}
			}
			CollectionPub {
				rank: "b"
				Pub pub2 {
					Release {}
				}
			}
			CollectionPub {
				rank: "c"
				Pub unreleasedPub {
					Member {
						permissions: "view"
						User unreleasePubMember {}
					}
				}
			}
		}
	}
	Community {
		Member {
			permissions: "admin"
			User anotherAdmin { }
		}
	}
`;

setup(beforeAll, async () => {
	await models.resolve();
});

it('gets a list of pubs in a collection', async () => {
	const { community, hasPubs, pub1, pub2 } = models;
	const agent = await login();
	const { body: pubs } = await agent
		.get('/api/collectionPubs')
		.query({ collectionId: hasPubs.id, communityId: community.id })
		.expect(200);
	expect(pubs.map((pub) => pub.id)).toEqual([pub1.id, pub2.id]);
});

it('lists unreleases Pubs for users with relevant membership', async () => {
	const {
		admin,
		community,
		hasPubs,
		hasPubsMember,
		pub1,
		pub2,
		unreleasedPub,
		unreleasePubMember,
	} = models;
	await Promise.all(
		[unreleasePubMember, hasPubsMember, admin].map(async (member) => {
			const agent = await login(member);
			const { body: pubs } = await agent
				.get('/api/collectionPubs')
				.query({ collectionId: hasPubs.id, communityId: community.id })
				.expect(200);
			expect(pubs.map((pub) => pub.id)).toEqual([pub1.id, pub2.id, unreleasedPub.id]);
		}),
	);
});

it('creates a collectionPub and sets its rank', async () => {
	const { admin, community, pub, issue } = models;
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
	const { community, anotherAdmin, issue, pub } = models;
	const agent = await login(anotherAdmin);
	await agent
		.post('/api/collectionPubs')
		.send({ pubId: pub.id, collectionId: issue.id, communityId: community.id })
		.expect(403);
});

it('does not let (mere) Pub-level admins add their Pubs to collections', async () => {
	const { community, pubAdmin, issue, pub } = models;
	const agent = await login(pubAdmin);
	await agent
		.post('/api/collectionPubs')
		.send({ pubId: pub.id, collectionId: issue.id, communityId: community.id })
		.expect(403);
});

it('lets collection managers add Pubs to their collections', async () => {
	const { community, collectionManager, issue, pubToAdd } = models;
	const agent = await login(collectionManager);
	await agent
		.post('/api/collectionPubs')
		.send({ pubId: pubToAdd.id, collectionId: issue.id, communityId: community.id })
		.expect(201);
});

it('handles ranks correctly', async () => {
	const { community, admin, issue, pub, anotherPub } = models;
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

it('makes a non-tag collectionPub primary when it is the first public non-tag collection for a pub', async () => {
	const { community, admin, pub, book, tag } = models;
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
	const { community, admin, pub, issue, book } = models;
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
	const { community, admin, pub, book } = models;
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
	const { admin, community, pub, issue, book } = models;
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
	const { admin, community, pub, issue } = models;
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
	const { admin, community, pub, issue } = models;
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

teardown(afterAll);
