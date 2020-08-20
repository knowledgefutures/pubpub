/* eslint-disable no-restricted-syntax, no-await-in-loop */
/* global it, expect, beforeAll, afterAll */
import uuid from 'uuid/v4';

import { setup, teardown, login, modelize } from 'stubstub';
import { CollectionPub, Pub } from 'server/models';

const defaultCollectionId = uuid();

const models = modelize`
	Community community {
        defaultPubCollections: ${[defaultCollectionId]}
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
    Community {
        Collection nefariousCollection {
            Member {
                permissions: "manage"
                User nefariousUser {}
            }
        }
    }
`;

setup(beforeAll, async () => {
	await models.resolve();
});

it('does not allow random visitors to create a Pub', async () => {
	const { community } = models;
	const agent = await login();
	await agent
		.post('/api/pubs')
		.send({ communityId: community.id })
		.expect(403);
});

it('does not allow Members with insufficient permissions to create a Pub', async () => {
	const { community, communityMember } = models;
	const agent = await login(communityMember);
	await agent
		.post('/api/pubs')
		.send({ communityId: community.id })
		.expect(403);
});

it('does not allow Members from other Communities to create a Pub', async () => {
	const { community, nefariousCollection, nefariousUser } = models;
	const agent = await login(nefariousUser);
	await agent
		.post('/api/pubs')
		.send({ communityId: community.id, collectionId: nefariousCollection.id })
		.expect(403);
});

it('allows a Community manager to create a Pub (and adds it to Community default Collection)', async () => {
	const { community, communityManager } = models;
	const agent = await login(communityManager);
	const { body: pub } = await agent
		.post('/api/pubs')
		.send({ communityId: community.id })
		.expect(201);
	const collectionPub = await CollectionPub.findOne({
		where: {
			pubId: pub.id,
			collectionId: defaultCollectionId,
		},
	});
	expect(collectionPub).toBeTruthy();
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
	await agent
		.put('/api/pubs')
		.send({ pubId: pub.id, title: 'Bwa ha ha' })
		.expect(403);
});

it('allows a Community, Collection, Pub manager to update some fields on a Pub (but not others)', async () => {
	const { pub, pubManager, collectionManager, communityManager } = models;
	for (const user of [pubManager, collectionManager, communityManager]) {
		const agent = await login(user);
		const title = `${user.id} was here!`;
		await agent
			.put('/api/pubs')
			.send({ pubId: pub.id, title: title, doi: 'some_doi' })
			.expect(200);
		const pubNow = await Pub.findOne({ where: { id: pub.id } });
		expect(pubNow).toMatchObject({ title: title, doi: null });
	}
});

it('allows a Pub admin to set a DOI on a Pub', async () => {
	const { pub, pubAdmin } = models;
	const agent = await login(pubAdmin);
	await agent
		.put('/api/pubs')
		.send({ pubId: pub.id, doi: 'some_doi' })
		.expect(200);
	const pubNow = await Pub.findOne({ where: { id: pub.id } });
	expect(pubNow).toMatchObject({ doi: 'some_doi' });
});

it('forbids a user without permissions from deleting a Pub', async () => {
	const { pub, nefariousUser } = models;
	const agent = await login(nefariousUser);
	await agent
		.delete('/api/pubs')
		.send({ pubId: pub.id })
		.expect(403);
});

it('forbids a Member without sufficient permissions from deleting a Pub', async () => {
	const { destroyThisPub, angryPubEditor } = models;
	const agent = await login(angryPubEditor);
	await agent
		.delete('/api/pubs')
		.send({ pubId: destroyThisPub.id })
		.expect(403);
});

it('allows a Pub manager to delete a Pub', async () => {
	const { destroyThisPub, destructivePubManager } = models;
	const agent = await login(destructivePubManager);
	await agent
		.delete('/api/pubs')
		.send({ pubId: destroyThisPub.id })
		.expect(200);
});

it('allows a Community manager to delete a Pub', async () => {
	const { alsoDestroyThisPub, communityManager } = models;
	const agent = await login(communityManager);
	await agent
		.delete('/api/pubs')
		.send({ pubId: alsoDestroyThisPub.id })
		.expect(200);
});

teardown(afterAll);
