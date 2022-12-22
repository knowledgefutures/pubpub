import { setup, login } from 'stubstub';

import { models } from './data';

setup(beforeAll, async () => {
	await models.resolve();
});

const getHost = (community) => `${community.subdomain}.pubpub.org`;

const countItems = (xmlText) => (xmlText.match(/<item>/g) || []).length;

it('responds with an RSS feed for a community', async () => {
	const { community } = models;
	const agent = await login();
	const host = getHost(community);
	const body = await agent.get(`/rss.xml`).set('Host', host).expect(200);
	expect(countItems(body.text)).toEqual(4);
});

it('respects query parameters', async () => {
	const { community } = models;
	const agent = await login();
	const host = getHost(community);
	const body = await agent
		.get(`/rss.xml`)
		.query({ collections: 'c2', publishedAfter: '2020-03-01' })
		.set('Host', host)
		.expect(200);
	expect(countItems(body.text)).toEqual(2);
});

it('responds with 404 when requested from base pubpub', async () => {
	process.env.FORCE_BASE_PUBPUB = 'true';
	const agent = await login();
	await agent.get(`/rss.xml`).expect(404);
});
