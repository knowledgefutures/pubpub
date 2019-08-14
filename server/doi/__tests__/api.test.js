/* global describe, it, expect, beforeAll, afterAll, beforeEach, afterEach */
import sinon from 'sinon';

import { makeUser, makeCommunity, setup, teardown, login } from '../../../stubstub';

import { createPub } from '../../pub/queries';
import { createCollection } from '../../collection/queries';

import * as submit from '../submit';

let doiStub;
let testCommunity;
let otherTestCommunity;
let pubManager;
let dummyPub;
let dummyCollection;
let randomUser;

beforeEach(() => {
	doiStub = sinon.stub(submit, 'submitDoiData').returns(Promise.resolve());
});

afterEach(() => {
	doiStub.restore();
});

setup(beforeAll, async () => {
	testCommunity = await makeCommunity();
	otherTestCommunity = await makeCommunity();
	randomUser = await makeUser();
	pubManager = await makeUser();
	dummyPub = await createPub({ communityId: testCommunity.community.id }, pubManager);
	dummyCollection = await createCollection({
		communityId: testCommunity.community.id,
		kind: 'issue',
		title: 'Just a test collection',
	});
});

describe('/api/doi', () => {
	it('does not let random users create a DOI', async () => {
		const { community } = testCommunity;
		const agent = await login(randomUser);

		await agent
			.post('/api/doi/pub')
			.send({ pubId: dummyPub.id, communityId: community.id })
			.expect(403);
		await agent
			.post('/api/doi/collection')
			.send({ collectionId: dummyCollection.id, communityId: community.id })
			.expect(403);
	});

	it('does not let admins of other communities create a DOI', async () => {
		const { community } = testCommunity;
		const { admin: otherAdmin } = otherTestCommunity;
		const agent = await login(otherAdmin);
		await agent
			.post('/api/doi/pub')
			.send({ pubId: dummyPub.id, communityId: community.id })
			.expect(403);
		await agent
			.post('/api/doi/collection')
			.send({ collectionId: dummyCollection.id, communityId: community.id })
			.expect(403);
	});

	it('lets pub managers create a DOI for their own pubs', async () => {
		const { community } = testCommunity;
		const agent = await login(pubManager);
		const pub = await createPub({ communityId: testCommunity.community.id }, pubManager);
		const {
			body: { dois },
		} = await agent
			.post('/api/doi/pub')
			.send({ pubId: pub.id, communityId: community.id })
			.expect(201);
		expect(dois.pub).toEqual(`10.21428/${community.id.slice(0, 8)}.${pub.id.slice(0, 8)}`);
		expect(doiStub.called).toEqual(true);
	});

	it('lets community admins create a DOI for pubs in their community', async () => {
		const { admin, community } = testCommunity;
		const pub = await createPub({ communityId: testCommunity.community.id }, pubManager);
		const agent = await login(admin);
		const {
			body: { dois },
		} = await agent
			.post('/api/doi/pub')
			.send({ pubId: pub.id, communityId: community.id })
			.expect(201);
		expect(dois.pub).toEqual(`10.21428/${community.id.slice(0, 8)}.${pub.id.slice(0, 8)}`);
		expect(doiStub.called).toEqual(true);
	});

	it('lets community admins create a DOI for collections in their community', async () => {
		const { admin, community } = testCommunity;
		const collection = await createCollection({
			communityId: community.id,
			kind: 'issue',
			title: 'Just a test issue',
		});
		const agent = await login(admin);
		const {
			body: { dois },
		} = await agent
			.post('/api/doi/collection')
			.send({ collectionId: collection.id, communityId: community.id })
			.expect(201);
		expect(dois.collection).toEqual(
			`10.21428/${community.id.slice(0, 8)}.${collection.id.slice(0, 8)}`,
		);
		expect(doiStub.called).toEqual(true);
	});
});

teardown(afterAll);
