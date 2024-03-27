import { setup, teardown, stubFirebaseAdmin, login, modelize } from 'stubstub';

const models = modelize`
	Community community {
		Pub pub {
        }
	}
`;

stubFirebaseAdmin();

setup(beforeAll, async () => {
	await models.resolve();
});

teardown(afterAll);

const getHost = (community) => `${community.subdomain}.pubpub.org`;

describe('/pub/download/pdf', () => {
	it('404s for undefined community', async () => {
		const { pub } = models;

		const agent = await login();
		const host = 'something.pubpub.org';

		await agent.get(`/pub/${pub.slug}/download/pdf`).set('Host', host).expect(404);
	});

	it('404s for missing pub', async () => {
		const { community } = models;

		const agent = await login();
		const host = getHost(community);

		await agent.get(`/pub/fakeSlug/download/pdf`).set('Host', host).expect(404);
	});
});
