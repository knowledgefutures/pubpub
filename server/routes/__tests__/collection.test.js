/* global describe, it, expect, beforeAll, afterAll */
import { setup, teardown, login, modelize } from 'stubstub';

const models = modelize`
	Community {
		Collection noLinkedPageCollection {
			kind: "issue"
			title: "Issue One"
			isPublic: true
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

describe('/collection', () => {
	it('redirects to a search when a Collection does not have a linked Page', async () => {
		const { noLinkedPageCollection: collection } = models;
		const agent = await login();
		const { headers } = await agent
			.get('/collection/' + collection.id.slice(0, 8))
			.send()
			.expect(302);
		expect(headers.location).toEqual('/search?q=' + escape(collection.title));
	});

	it('redirects to the linked Page for a Collection, when it exists', async () => {
		const { linkedPageCollection: collection, linkedPage: page } = models;
		const agent = await login();
		const { headers } = await agent
			.get('/collection/' + collection.id.slice(0, 8))
			.send()
			.expect(302);
		expect(headers.location).toEqual('/' + page.slug);
	});

	it('responds with a 404 for invalid collection IDs', async () => {
		const agent = await login();
		await agent
			.get('/collection/qwertyuiop')
			.send()
			.expect(404);
	});
});

teardown(afterAll);
