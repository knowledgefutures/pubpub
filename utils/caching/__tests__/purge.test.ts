import { finishDeferredTasks } from 'server/utils/deferred';
import { login, modelize, setup, teardown } from 'stubstub';
import { setEnvironment } from 'utils/environment';

const models = modelize`
    Community community {
        Pub testPub {
            slug: "test-pub"
        }
        Member {
            permissions: "admin"
            User admin {}
        }
        Page testPage {
            title: "test page"
            slug: "test-page"
        }
    }
`;

setup(beforeAll, async () => {
	await models.resolve();

	process.env.TEST_FASTLY_PURGE = '1';

	// mock fetch, we don't actually want to send api calls
	jest.spyOn(global, 'fetch').mockImplementation(
		() =>
			Promise.resolve({
				json: () => Promise.resolve({ status: 'ok', id: 'id' }),
			}) as unknown as Promise<Response>,
	);
});

teardown(afterAll, () => {
	delete process.env.TEST_FASTLY_PURGE;
	setEnvironment(false, false, false);

	jest.restoreAllMocks();
});

describe('purging', () => {
	beforeEach(() => {
		// reset "has been called" status of all mocks
		jest.clearAllMocks();
		setEnvironment(false, false, false);
	});
	it('should purge on creating pub', async () => {
		const { community, admin } = models;

		const agent = await login(admin);
		await agent
			.post('/api/pubs')
			.send({ communityId: community.id, title: 'test pub' })
			.expect(201);

		await finishDeferredTasks();

		expect(global.fetch).toHaveBeenCalledWith(
			`https://api.fastly.com/service/${process.env.FASTLY_SERVICE_ID_PROD}/purge/demo.pubpub.org`,
			{ headers: { Accept: 'application/json', 'Fastly-Key': 'token' }, method: 'POST' },
		);
	});

	it('should not purge on GET routes, non-API routes, and certain excluded routes', async () => {
		const { community, admin, testPub, testPage } = models;

		const agent = await login(admin);

		const host = `${community.subdomain}.pubpub.org`;
		const callsThatShouldntPurge = [
			agent.get('/api/pubs').set('Host', host).send().expect(200),
			agent.get(`/${testPage.slug}`).set('Host', host).send().expect(200),
			agent
				.post('/api/export')
				.set('Host', host)
				.send({
					pubId: testPub.id,
					format: 'pdf',
					communityId: community.id,
				})
				.expect(201),
		];

		await Promise.all(callsThatShouldntPurge);

		await finishDeferredTasks();

		expect(global.fetch).toHaveBeenCalledTimes(0);
	}, 70000);

	it('should debounce purges', async () => {
		const { community, admin } = models;

		const agent = await login(admin);

		const callsThatShouldPurge = [
			agent.post('/api/pubs').send({
				communityId: community.id,
			}),
			agent.post('/api/pubs').send({
				communityId: community.id,
			}),
			agent.post('/api/pubs').send({
				communityId: community.id,
			}),
			agent.post('/api/pubs').send({
				communityId: community.id,
			}),
			agent.post('/api/pubs').send({
				communityId: community.id,
			}),
		];

		await Promise.all(callsThatShouldPurge);

		await finishDeferredTasks();

		expect(global.fetch).toHaveBeenCalledTimes(1);
	}, 50000);

	it('should not debounce purges of different tags', async () => {
		const { community, admin } = models;

		const agent = await login(admin);

		const host = `something.pubpub.org`;
		const fakeHost = 'fake.pubpub.org';

		const callsThatShouldPurge = [
			agent
				.post('/api/pubs')
				.send({
					communityId: community.id,
				})
				.set('Host', host),
			agent
				.post('/api/pubs')
				.send({
					communityId: community.id,
				})
				.set('Host', fakeHost),
			agent
				.post('/api/pubs')
				.send({
					communityId: community.id,
				})
				.set('Host', host),
			agent
				.post('/api/pubs')
				.send({
					communityId: community.id,
				})
				.set('Host', fakeHost),
		];

		await Promise.all(callsThatShouldPurge);

		await finishDeferredTasks();

		expect(global.fetch).toHaveBeenCalledTimes(2);
		expect(global.fetch).toHaveBeenCalledWith(
			`https://api.fastly.com/service/${process.env.FASTLY_SERVICE_ID_PROD}/purge/something.pubpub.org`,
			{
				headers: {
					Accept: 'application/json',
					'Fastly-Key': process.env.FASTLY_PURGE_TOKEN_PROD,
				},
				method: 'POST',
			},
		);
		expect(global.fetch).toHaveBeenCalledWith(
			`https://api.fastly.com/service/${process.env.FASTLY_SERVICE_ID_PROD}/purge/fake.pubpub.org`,
			{
				headers: {
					Accept: 'application/json',
					'Fastly-Key': process.env.FASTLY_PURGE_TOKEN_PROD,
				},
				method: 'POST',
			},
		);
	}, 50000);

	it('should not purge on qubqub', async () => {
		const { community, admin } = models;

		const agent = await login(admin);

		setEnvironment(false, false, true);

		const host = `something.pubpub.org`;

		await agent
			.post('/api/pubs')
			.send({
				communityId: community.id,
			})
			.set('Host', host)
			.expect(201);

		await finishDeferredTasks();

		expect(global.fetch).toHaveBeenCalledTimes(0);

		setEnvironment(true, false, false);

		await agent
			.post('/api/pubs')
			.send({
				communityId: community.id,
			})
			.set('Host', host)
			.expect(201);

		await finishDeferredTasks();

		expect(global.fetch).toHaveBeenCalledTimes(1);
	});

	it('should purge the appropriate host depending on env', async () => {
		const { community, admin } = models;

		setEnvironment(false, true, false);

		const agent = await login(admin);

		const host = `something.pubpub.org`;

		await agent
			.post('/api/pubs')
			.send({
				communityId: community.id,
			})
			.set('Host', host)
			.expect(201);

		await finishDeferredTasks();

		expect(global.fetch).toHaveBeenCalledTimes(1);
		expect(global.fetch).toHaveBeenCalledWith(
			`https://api.fastly.com/service/${process.env.FASTLY_SERVICE_ID_DUQDUQ}/purge/something.duqduq.org`,
			{
				headers: {
					Accept: 'application/json',
					'Fastly-Key': process.env.FASTLY_PURGE_TOKEN_DUQDUQ,
				},
				method: 'POST',
			},
		);
	});
});
