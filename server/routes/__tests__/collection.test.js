/* global describe, it, expect, beforeAll, afterAll */

import { makeCommunity, setup, teardown, login } from '../../../stubstub';
import { createCollection } from '../../collection/queries';
import { createPage } from '../../page/queries';

let testCommunity;

setup(beforeAll, async () => {
	testCommunity = await makeCommunity();
});

describe('/collection', () => {
	it('redirects to a search when a Collection does not have a linked Page', async () => {
		const { community } = testCommunity;
		const collection = await createCollection({
			communityId: community.id,
			kind: 'issue',
			title: 'The Book of Tests',
		});
		const agent = await login();
		const { headers } = await agent
			.get('/collection/' + collection.id.slice(0, 8))
			.send()
			.expect(302);
		expect(headers.location).toEqual('/search?q=' + escape(collection.title));
	});

	it('redirects to the linked Page for a Collection, when it exists', async () => {
		const { community } = testCommunity;
		const collection = await createCollection({
			communityId: community.id,
			kind: 'issue',
			title: 'The Book of Tests',
		});
		const page = await createPage({
			communityId: community.id,
			title: 'The Page of Tests',
			description: 'I sure hope this works!',
			slug: 'test-page',
		});
		collection.pageId = page.id;
		await collection.save();
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
