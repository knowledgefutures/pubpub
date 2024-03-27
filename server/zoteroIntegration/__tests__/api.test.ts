import { login, modelize, setup, teardown } from 'stubstub';

const models = modelize`
    Community community {
        Member member {
            User user {}
        }
    }
`;

setup(beforeAll, async () => {
	await models.resolve();
});

teardown(afterAll);

describe('/api/zoteroIntegration', () => {
	it('returns 403 if you are not logged in', async () => {
		const agent = await login();

		await agent.get('/api/citations/zotero').expect(403);
	});
});
