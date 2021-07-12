/* global describe, it, expect, beforeAll, afterAll */
import { setup, teardown, login, modelize } from 'stubstub';

const models = modelize`
	Community community {
		Member {
			permissions: "manage"
			User communityManager {}
		}
		Collection layoutCollection {
			kind: "issue"
			title: "Issue One"
			isPublic: true
		}
		Collection privateCollection {
			kind: "issue"
			title: "Issue One and a Half"
			isPublic: false
			Member {
				permissions: "view"
				User collectionViewer {}
			}
		}
		Collection linkedPageCollection {
			kind: "issue"
			title: "Issue Two"
			isPublic: true
			page: Page linkedPage {
				title: "Issue Two"
				slug: "issue-two"
			}
		}
	}
`;

setup(beforeAll, async () => {
	await models.resolve();
});

const getHost = (community) => `${community.subdomain}.pubpub.org`;

describe('/collection', () => {
	it('resolves a Collection layout when provided a slug', async () => {
		const { layoutCollection: collection, community } = models;
		const agent = await login();
		const host = getHost(community);

		await agent
			.get(`/${collection.slug}`)
			.set('Host', host)
			.send()
			.expect(200);
	});

	it('only resolves a private Collection for Collection Members, or Community Members with manage permissions', async () => {
		const {
			privateCollection: collection,
			community,
			communityManager,
			collectionViewer,
		} = models;
		const host = getHost(community);

		await (await login())
			.get('/collection/' + collection.slug)
			.set('Host', host)
			.send()
			.expect(404);

		await (await login(communityManager))
			.get('/collection/' + collection.slug)
			.set('Host', host)
			.send()
			.expect(200);

		await (await login(collectionViewer))
			.get('/collection/' + collection.slug)
			.set('Host', host)
			.send()
			.expect(200);
	});

	it('redirects to a Collection when provided a partial uuid', async () => {
		const { layoutCollection: collection, community } = models;
		const agent = await login();
		const host = getHost(community);

		const { headers } = await agent
			.get('/collection/' + collection.id.slice(0, 8))
			.set('Host', host)
			.send()
			.expect(302);
		expect(headers.location).toEqual(`/${collection.slug}`);
	});

	it('redirects to the linked Page for a Collection, when it exists', async () => {
		const { linkedPageCollection: collection, linkedPage: page, community } = models;
		const agent = await login();
		const host = getHost(community);
		const { headers } = await agent
			.get(`/${collection.slug}`)
			.set('Host', host)
			.send()
			.expect(302);
		expect(headers.location).toEqual(`/${page.slug}`);
	});

	it('responds with a 404 for invalid collection IDs', async () => {
		const { community } = models;
		const agent = await login();
		const host = getHost(community);
		await agent
			.get('/collection/qwertyuiop')
			.set('Host', host)
			.send()
			.expect(404);
	});
});

teardown(afterAll);
