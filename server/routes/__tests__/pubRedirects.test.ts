/* global describe, it, expect, beforeAll, afterAll */
import { setup, teardown, stubFirebaseAdmin, login, modelize } from 'stubstub';

const models = modelize`
	Community community {
		Member {
			permissions: "view"
			User communityViewer {}
		}
		Pub draftPub {
			Member {
				permissions: "edit"
				User draftPubEditor {}
			}
		}
		Pub releasePub {
			Release {}
			Release {}
			Release {}
		}
	}
`;

stubFirebaseAdmin();

setup(beforeAll, async () => {
	await models.resolve();
});

const getHost = (community) => `${community.subdomain}.pubpub.org`;

describe('/pub', () => {
	it('302s from /pub/:slug to the draft for unreleased pubs', async () => {
		const { draftPub, draftPubEditor, community } = models;
		const agent = await login(draftPubEditor);
		const host = getHost(community);
		const { headers } = await agent
			.get(`/pub/${draftPub.slug}`)
			.set('Host', host)
			.expect(302);
		expect(headers.location).toEqual(`https://${host}/pub/${draftPub.slug}/draft`);
	});

	it('404s from /pub/:slug/draft for visitors without view permissions', async () => {
		const { draftPub, community } = models;
		const agent = await login();
		const host = getHost(community);
		await agent
			.get(`/pub/${draftPub.slug}/draft`)
			.set('Host', host)
			.expect(404);
	});

	it('302s from /pub/:slug to the latest Release for visitors', async () => {
		const { releasePub, community } = models;
		const agent = await login();
		const host = getHost(community);
		const { headers } = await agent
			.get(`/pub/${releasePub.slug}`)
			.set('Host', host)
			.expect(302);
		expect(headers.location).toEqual(`https://${host}/pub/${releasePub.slug}/release/3`);
	});

	it('302s from /pub/:slug/branch/:num to /pub/:slug', async () => {
		const { releasePub, community } = models;
		const agent = await login();
		const host = getHost(community);
		const { headers } = await agent
			.get(`/pub/${releasePub.slug}/branch/1?foo=bar`)
			.set('Host', host)
			.expect(302);
		expect(headers.location).toEqual(`https://${host}/pub/${releasePub.slug}?foo=bar`);
	});

	it('302s from /pub/:slug/:branch/:versionNumber to a specific Release for visitors', async () => {
		const { releasePub, community } = models;
		const agent = await login();
		const host = getHost(community);
		const { headers } = await agent
			.get(`/pub/${releasePub.slug}/branch/1/2?bar=baz&quz=baz_again`)
			.set('Host', host)
			.expect(302);
		expect(headers.location).toEqual(
			`https://${host}/pub/${releasePub.slug}/release/2?bar=baz&quz=baz_again`,
		);
	});
});

teardown(afterAll);
