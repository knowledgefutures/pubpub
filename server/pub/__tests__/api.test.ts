/* eslint-disable no-restricted-syntax, no-await-in-loop */
/* global describe, it, expect, beforeAll, afterAll */
import uuid from 'uuid/v4';

import { setup, teardown, login, modelize, expectCreatedActivityItem } from 'stubstub';
import { CollectionPub, Pub, Draft } from 'server/models';
import { issueCreatePubToken } from '../tokens';

const defaultCollectionId = uuid();

const models = modelize`
	Community community {
		defaultPubCollections: ${[defaultCollectionId]}
		hideCreatePubButton: true
        Member {
            permissions: "manage"
            User communityManager {}
        }
        Member {
            permissions: "edit"
            User communityMember {}
        }
		Collection collection {
            Member {
                permissions: "manage"
                User collectionManager {}
            }
            CollectionPub {
                rank: "h"
                Pub pub {
                    Member {
                        permissions: "admin"
                        User pubAdmin {}
                    }
                    Member {
                        permissions: "manage"
                        User pubManager {}
                    }
                }
            }
        }
        Collection defaultCollection {
            id: ${defaultCollectionId}
		}
		Collection c1 {}
		Collection c2 {}
        Pub destroyThisPub {
            Member {
                permissions: "manage"
                User destructivePubManager {}
            }
            Member {
                permissions: "edit"
                User angryPubEditor {}
            }
        }
        Pub alsoDestroyThisPub {}
    }
    Community nefariousCommunity {
        Collection nefariousCollection {
            Member {
                permissions: "manage"
                User nefariousUser {}
            }
		}
	}
	Community permissiveCommunity {}
	User randomUser {}
	User anotherRandomUser {}
`;

setup(beforeAll, async () => {
	await models.resolve();
});

describe('/api/pubs', () => {
	it('does not allow logged-out visitors to create a Pub', async () => {
		const { community } = models;
		const agent = await login();
		await agent.post('/api/pubs').send({ communityId: community.id }).expect(403);
	});

	it('does not allow random users to create a Pub', async () => {
		const { community, randomUser } = models;
		const agent = await login(randomUser);
		await agent.post('/api/pubs').send({ communityId: community.id }).expect(403);
	});

	it('lets random users create a Pub in communities with hideCreatePubButton=false', async () => {
		const { permissiveCommunity, randomUser } = models;
		const agent = await login(randomUser);
		await agent.post('/api/pubs').send({ communityId: permissiveCommunity.id }).expect(201);
	});

	it('lets random users create a Pub with a valid createPub token', async () => {
		const { community, randomUser, c1, c2, defaultCollection } = models;
		const token = issueCreatePubToken({
			userId: randomUser.id,
			communityId: community.id,
			createInCollectionIds: [c1.id, c2.id],
		});
		const agent = await login(randomUser);
		const { body: pub } = await agent
			.post('/api/pubs')
			.send({
				communityId: community.id,
				createPubToken: token,
			})
			.expect(201);
		const collectionPubs = await CollectionPub.findAll({ where: { pubId: pub.id } });
		expect(collectionPubs.map((cp) => cp.collectionId).sort()).toEqual(
			[c1.id, c2.id, defaultCollection.id].sort(),
		);
	});

	it('does not accept createPub tokens from other users or communities', async () => {
		const { community, nefariousCommunity, randomUser, anotherRandomUser } = models;
		const token = issueCreatePubToken({
			userId: randomUser.id,
			communityId: nefariousCommunity.id,
			createInCollectionIds: [],
		});
		const agent = await login(randomUser);
		await agent
			.post('/api/pubs')
			.send({
				communityId: community.id,
				createPubToken: token,
			})
			.expect(403);
		const anotherAgent = await login(anotherRandomUser);
		await anotherAgent
			.post('/api/pubs')
			.send({
				communityId: nefariousCommunity.id,
				createPubToken: token,
			})
			.expect(403);
	});

	it('does not allow Members with insufficient permissions to create a Pub', async () => {
		const { community, communityMember } = models;
		const agent = await login(communityMember);
		await agent.post('/api/pubs').send({ communityId: community.id }).expect(403);
	});

	it('does not allow Members from other Communities to create a Pub', async () => {
		const { community, nefariousCollection, nefariousUser } = models;
		const agent = await login(nefariousUser);
		await agent
			.post('/api/pubs')
			.send({ communityId: community.id, collectionId: nefariousCollection.id })
			.expect(403);
	});

	it('allows a Community manager to create a Pub (and adds it to Community default Collection, creates a Draft)', async () => {
		const { community, communityManager } = models;
		const agent = await login(communityManager);
		const { body: pub } = await expectCreatedActivityItem(
			agent.post('/api/pubs').send({ communityId: community.id }).expect(201),
		).toMatchResultingObject((response) => ({
			kind: 'pub-created',
			pubId: response.body.id,
			actorId: communityManager.id,
		}));
		const collectionPub = await CollectionPub.findOne({
			where: {
				pubId: pub.id,
				collectionId: defaultCollectionId,
			},
		});
		expect(collectionPub).toBeTruthy();
		const draft = await Draft.findOne({ where: { id: pub.draftId } });
		expect(draft).toBeTruthy();
	});

	it('allows a Collection manager to create a Pub (and adds it to the Collection)', async () => {
		const { community, collection, collectionManager } = models;
		const agent = await login(collectionManager);
		const { body: pub } = await agent
			.post('/api/pubs')
			.send({ communityId: community.id, collectionId: collection.id })
			.expect(201);
		const collectionPub = await CollectionPub.findOne({
			where: {
				pubId: pub.id,
				collectionId: collection.id,
			},
		});
		expect(collectionPub).toBeTruthy();
	});

	it('forbids a user without permissions from updating a Pub', async () => {
		const { pub, nefariousUser } = models;
		const agent = await login(nefariousUser);
		await agent.put('/api/pubs').send({ pubId: pub.id, title: 'Bwa ha ha' }).expect(403);
	});

	it('creates an ActivityItem when a Pub is updated', async () => {
		const { pub, pubManager } = models;
		const agent = await login(pubManager);
		const title = `${pubManager.id} was here!`;
		await expectCreatedActivityItem(
			agent.put('/api/pubs').send({ pubId: pub.id, title, doi: 'some_doi' }).expect(200),
		).toMatchObject({
			kind: 'pub-updated',
			pubId: pub.id,
			actorId: pubManager.id,
			payload: {
				title: { from: pub.title, to: title },
			},
		});
	});

	it('allows a Community, Collection, Pub manager to update some fields on a Pub (but not others)', async () => {
		const { pub, pubManager, collectionManager, communityManager } = models;
		for (const user of [pubManager, collectionManager, communityManager]) {
			const agent = await login(user);
			const title = `${user.id} was here!`;
			await agent
				.put('/api/pubs')
				.send({ pubId: pub.id, title, doi: 'some_doi' })
				.expect(200);
			const pubNow = await Pub.findOne({ where: { id: pub.id } });
			expect(pubNow).toMatchObject({ title, doi: null });
		}
	});

	it('allows a Pub admin to set a DOI on a Pub', async () => {
		const { pub, pubAdmin } = models;
		const agent = await login(pubAdmin);
		await expectCreatedActivityItem(
			agent.put('/api/pubs').send({ pubId: pub.id, doi: 'some_doi' }).expect(200),
		).toMatchObject({
			kind: 'pub-updated',
			pubId: pub.id,
			actorId: pubAdmin.id,
			payload: { doi: { from: null, to: 'some_doi' } },
		});
		const pubNow = await Pub.findOne({ where: { id: pub.id } });
		expect(pubNow).toMatchObject({ doi: 'some_doi' });
	});

	it('forbids a user without permissions from deleting a Pub', async () => {
		const { pub, nefariousUser } = models;
		const agent = await login(nefariousUser);
		await agent.delete('/api/pubs').send({ pubId: pub.id }).expect(403);
	});

	it('forbids a Member without sufficient permissions from deleting a Pub', async () => {
		const { destroyThisPub, angryPubEditor } = models;
		const agent = await login(angryPubEditor);
		await agent.delete('/api/pubs').send({ pubId: destroyThisPub.id }).expect(403);
	});

	it('allows a Pub manager to delete a Pub', async () => {
		const { destroyThisPub, destructivePubManager } = models;
		const agent = await login(destructivePubManager);
		await expectCreatedActivityItem(
			agent.delete('/api/pubs').send({ pubId: destroyThisPub.id }).expect(200),
		).toMatchObject({
			kind: 'pub-removed',
			pubId: destroyThisPub.id,
			actorId: destructivePubManager.id,
		});
	});

	it('allows a Community manager to delete a Pub', async () => {
		const { alsoDestroyThisPub, communityManager } = models;
		const agent = await login(communityManager);
		await agent.delete('/api/pubs').send({ pubId: alsoDestroyThisPub.id }).expect(200);
	});
});

teardown(afterAll);
