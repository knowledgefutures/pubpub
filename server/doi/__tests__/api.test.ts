/* global it, expect, beforeAll, afterAll, beforeEach, afterEach */
import sinon from 'sinon';

import { setup, teardown, login, modelize } from 'stubstub';
import { CrossrefDepositRecord } from 'server/models';

import * as submit from '../submit';

const models = modelize`
	Community community {
		Member {
			permissions: "admin"
			User communityAdmin {}
		}
		Member {
			permissions: "manage"
			User communityManager {}
		}
		Pub pub {
			Release {}
			Member {
				permissions: "admin"
				User pubAdmin {}
			}
		}
		Pub draftOnlyPub {}
		Collection collection {
			title: "Issue me a DOI too"
			kind: "book"
			Member {
				permissions: "admin"
				User collectionAdmin {}
			}
		}
	}
	User guest {}
`;

let doiStub;

beforeEach(() => {
	doiStub = sinon.stub(submit, 'submitDoiData').returns(Promise.resolve());
});

afterEach(() => {
	doiStub.restore();
});

setup(beforeAll, async () => {
	await models.resolve();
});

it('does not let anyone who is not a community admin create a DOI', async () => {
	const {
		community,
		guest,
		pub,
		collection,
		pubAdmin,
		collectionAdmin,
		communityManager,
	} = models;

	const haplessUsers = [guest, pubAdmin, collectionAdmin, communityManager];

	return Promise.all(
		haplessUsers.map(async (user) => {
			const agent = await login(user);
			await agent
				.post('/api/doi')
				.send({ target: 'pub', pubId: pub.id, communityId: community.id })
				.expect(403);
			await agent
				.post('/api/doi')
				.send({
					target: 'collection',
					collectionId: collection.id,
					communityId: community.id,
				})
				.expect(403);
			await agent
				.get('/api/doiPreview')
				.query({ pubId: pub.id, communityId: community.id, target: 'pub' })
				.expect(403);
		}),
	);
});

it('forbids issuing a DOI to a Pub without a release', async () => {
	const { communityAdmin, community, draftOnlyPub } = models;
	const agent = await login(communityAdmin);
	await agent
		.post('/api/doi')
		.send({ target: 'pub', pubId: draftOnlyPub.id, communityId: community.id })
		.expect(403);
	await agent
		.get('/api/doiPreview')
		.query({ target: 'pub', pubId: draftOnlyPub.id, communityId: community.id })
		.expect(403);
});

it('lets community admins create a DOI for pubs in their community', async () => {
	const { communityAdmin, community, pub } = models;
	const expectedPubDoi = `10.21428/${community.id.slice(0, 8)}.${pub.id.slice(0, 8)}`;
	const agent = await login(communityAdmin);
	const {
		body: { dois },
	} = await agent
		.post('/api/doi')
		.send({ target: 'pub', pubId: pub.id, communityId: community.id })
		.expect(201);

	await pub.reload();

	const depositRecord = await CrossrefDepositRecord.findOne({
		where: { id: pub.crossrefDepositRecordId },
	});

	expect(dois.pub).toEqual(expectedPubDoi);
	expect(depositRecord.depositJson.deposit).toEqual(doiStub.firstCall.args[0]);
});

it('lets community admins preview a DOI for pubs in their community', async () => {
	const { communityAdmin, community, pub } = models;
	const expectedPubDoi = `10.21428/${community.id.slice(0, 8)}.${pub.id.slice(0, 8)}`;
	const agent = await login(communityAdmin);
	const {
		body: {
			depositJson: { dois: previewDois },
		},
	} = await agent
		.get('/api/doiPreview')
		.query({ target: 'pub', pubId: pub.id, communityId: community.id })
		.expect(200);

	expect(previewDois.pub).toEqual(expectedPubDoi);
});

it('lets community admins create a DOI for collections in their community', async () => {
	const { communityAdmin, community, collection } = models;
	const expectedCollectionDoi = `10.21428/${community.id.slice(0, 8)}.${collection.id.slice(
		0,
		8,
	)}`;
	const agent = await login(communityAdmin);
	const {
		body: { dois },
	} = await agent
		.post('/api/doi')
		.send({ target: 'collection', collectionId: collection.id, communityId: community.id })
		.expect(201);

	await collection.reload();

	const depositRecord = await CrossrefDepositRecord.findOne({
		where: { id: collection.crossrefDepositRecordId },
	});

	expect(dois.collection).toEqual(expectedCollectionDoi);
	expect(depositRecord.depositJson.deposit).toEqual(doiStub.firstCall.args[0]);
});

it('lets community admins preview a DOI for collections in their community', async () => {
	const { communityAdmin, community, collection } = models;
	const expectedCollectionDoi = `10.21428/${community.id.slice(0, 8)}.${collection.id.slice(
		0,
		8,
	)}`;
	const agent = await login(communityAdmin);
	const {
		body: {
			depositJson: { dois: previewDois },
		},
	} = await agent
		.get('/api/doiPreview')
		.query({ target: 'collection', collectionId: collection.id, communityId: community.id })
		.expect(200);

	expect(previewDois.collection).toEqual(expectedCollectionDoi);
});

teardown(afterAll);
