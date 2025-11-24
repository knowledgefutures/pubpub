import { z } from 'zod';

import { login, modelize, setup, teardown } from 'stubstub';

const models = modelize`
    Community community {
        Member {
            permissions: "manage"
            User communityManager {}
        }
        Pub pub {}
    }
`;

const sourceFiles = [
	{
		assetKey: '_testing/Abstract-01692108643052.md',
		clientPath: 'Abstract.md',
		id: 13,
		label: 'document',
		loaded: 1313,
		state: 'complete',
		total: 1313,
	},
];

setup(beforeAll, async () => {
	await models.resolve();
});

teardown(afterAll);

const uuidSchema = z.string().uuid();

// hard to test workers while testing, so this is just a very basic test
describe('/api/import', () => {
	it('succesfully creates an import task and returns task id', async () => {
		const { communityManager } = models;

		const agent = await login(communityManager);

		const res = await agent
			.post('/api/import')
			.send({
				sourceFiles,
				importerFlags: {},
			})
			.expect(201);

		const id = res.body;

		expect(uuidSchema.safeParse(id)).toEqual({ success: true, data: id });
	}, 20000);
});
