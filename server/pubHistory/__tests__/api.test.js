/* global it, expect, beforeAll, afterAll, beforeEach, afterEach */
import sinon from 'sinon';
import { setup, teardown, login, modelize } from 'stubstub';

import * as firebaseAdmin from 'server/utils/firebaseAdmin';

let getBranchDocStub;

const models = modelize`
    Community community {
        Collection collection {
            Member member {
                permissions: "admin"
                User collectionMember {}
            }
            CollectionPub {
                Pub pub {
					viewHash: "blah-blah-blah"
                    Release {}
                }
            }
        }
    }
    User guest {}
`;

setup(beforeAll, async () => {
	await models.resolve();
});

teardown(afterAll);

beforeEach(() => {
	getBranchDocStub = sinon.stub(firebaseAdmin, 'getBranchDoc');
});

afterEach(() => {
	getBranchDocStub.restore();
});

const makeHistoryQuery = ({ historyKey = 0, branchTitle, provideAccessHash = false } = {}) => {
	const { community, pub } = models;
	const branch = pub.branches.find((br) => br.title === branchTitle);
	const accessHash = provideAccessHash ? pub.viewHash : null;
	return {
		communityId: community.id,
		pubId: pub.id,
		branchId: branch.id,
		historyKey: historyKey,
		accessHash: accessHash,
	};
};

it('allows anyone to view the history of the public branch', async () => {
	const agent = await login();
	await agent
		.get('/api/pubHistory')
		.query(makeHistoryQuery({ branchTitle: 'public' }))
		.expect(200);
	expect(getBranchDocStub.called).toEqual(true);
});

it('forbids guests from viewing the history of the draft', async () => {
	const { guest } = models;
	const agent = await login(guest);
	await agent
		.get('/api/pubHistory')
		.query(makeHistoryQuery({ branchTitle: 'draft' }))
		.expect(403);
	expect(getBranchDocStub.called).toEqual(false);
});

it('lets guest view the history of the draft with an access hash', async () => {
	const { guest } = models;
	const agent = await login(guest);
	await agent
		.get('/api/pubHistory')
		.query(makeHistoryQuery({ branchTitle: 'draft', provideAccessHash: true }))
		.expect(200);
	expect(getBranchDocStub.called).toEqual(true);
});

it('lets members view the history of the draft', async () => {
	const { collectionMember } = models;
	const agent = await login(collectionMember);
	await agent
		.get('/api/pubHistory')
		.query(makeHistoryQuery({ branchTitle: 'draft' }))
		.expect(200);
	expect(getBranchDocStub.called).toEqual(true);
});
