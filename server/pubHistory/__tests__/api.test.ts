import { vi } from 'vitest';

import { login, modelize, setup, teardown } from 'stubstub';

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

const { getPubDraftDocStub } = vi.hoisted(() => {
	return {
		getPubDraftDocStub: vi.fn(),
	};
});

beforeEach(() => {
	vi.mock('server/utils/firebaseAdmin', () => ({
		getPubDraftDoc: getPubDraftDocStub,
	}));
});

afterEach(() => {
	vi.clearAllMocks();
});

const makeHistoryQuery = ({ historyKey, provideAccessHash = false }) => {
	const { community, pub } = models;
	const accessHash = provideAccessHash ? pub.viewHash : null;
	return {
		communityId: community.id,
		pubId: pub.id,
		historyKey,
		accessHash,
	};
};

it('allows anyone to view the history at the latest Release key', async () => {
	const agent = await login();
	await agent
		.get('/api/pubHistory')
		.query(makeHistoryQuery({ historyKey: 10 }))
		.expect(200);
	expect(getPubDraftDocStub).toHaveBeenCalled();
});

it('forbids guests from viewing the history of the draft', async () => {
	const { guest } = models;
	const agent = await login(guest);
	await agent
		.get('/api/pubHistory')
		.query(makeHistoryQuery({ historyKey: 5 }))
		.expect(403);
	expect(getPubDraftDocStub).not.toHaveBeenCalled();
});

it('lets guest view the history of the draft with an access hash', async () => {
	const { guest } = models;
	const agent = await login(guest);
	await agent
		.get('/api/pubHistory')
		.query(makeHistoryQuery({ historyKey: 5, provideAccessHash: true }))
		.expect(200);
	expect(getPubDraftDocStub).toHaveBeenCalled();
});

it('lets members view the history of the draft', async () => {
	const { collectionMember } = models;
	const agent = await login(collectionMember);
	await agent
		.get('/api/pubHistory')
		.query(makeHistoryQuery({ historyKey: 5 }))
		.expect(200);
	expect(getPubDraftDocStub).toHaveBeenCalled();
});
