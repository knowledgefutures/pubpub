/* global it, expect, beforeAll, afterAll, beforeEach, afterEach */
import sinon from 'sinon';
import { setup, teardown, login, modelize } from 'stubstub';

import * as firebaseAdmin from 'server/utils/firebaseAdmin';

let getPubDraftDocStub;

const models = modelize`
    Community community {
        Collection collection {
            Member member {
                permissions: "admin"
                User collectionMember {}
            }
            CollectionPub {
				rank: "h"
                Pub pub {
					viewHash: "blah-blah-blah"
                    Release {
						historyKey: 10
					}
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
	getPubDraftDocStub = sinon.stub(firebaseAdmin, 'getPubDraftDoc');
});

afterEach(() => {
	getPubDraftDocStub.restore();
});

const makeHistoryQuery = ({ historyKey, provideAccessHash = false }) => {
	const { community, pub } = models;
	const accessHash = provideAccessHash ? pub.viewHash : null;
	return {
		communityId: community.id,
		pubId: pub.id,
		historyKey: historyKey,
		accessHash: accessHash,
	};
};

it('allows anyone to view the history at the latest Release key', async () => {
	const agent = await login();
	await agent
		.get('/api/pubHistory')
		.query(makeHistoryQuery({ historyKey: 10 }))
		.expect(200);
	expect(getPubDraftDocStub.called).toEqual(true);
});

it('forbids guests from viewing the history of the draft', async () => {
	const { guest } = models;
	const agent = await login(guest);
	await agent
		.get('/api/pubHistory')
		.query(makeHistoryQuery({ historyKey: 5 }))
		.expect(403);
	expect(getPubDraftDocStub.called).toEqual(false);
});

it('lets guest view the history of the draft with an access hash', async () => {
	const { guest } = models;
	const agent = await login(guest);
	await agent
		.get('/api/pubHistory')
		.query(makeHistoryQuery({ historyKey: 5, provideAccessHash: true }))
		.expect(200);
	expect(getPubDraftDocStub.called).toEqual(true);
});

it('lets members view the history of the draft', async () => {
	const { collectionMember } = models;
	const agent = await login(collectionMember);
	await agent
		.get('/api/pubHistory')
		.query(makeHistoryQuery({ historyKey: 5 }))
		.expect(200);
	expect(getPubDraftDocStub.called).toEqual(true);
});
