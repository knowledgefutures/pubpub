import { Page } from 'server/models';
import { expectCreatedActivityItem, login, modelize, setup, teardown } from 'stubstub';
import { layoutBlockSchema } from 'utils/api/schemas/layout';
import { z } from 'zod';

const models = modelize`
	Community community {
		Member {
			permissions: "manage"
			User communityManager {}
		}
		Member {
			permissions: "edit"
			User communityMember {}
		}
        Page page {
            title: "Page"
            slug: "some-random-page"
        }
	}
	User randomUser {}
	User anotherRandomUser {}
`;

setup(beforeAll, async () => {
	await models.resolve();
});

teardown(afterAll);

describe('/api/pages', () => {
	it('does not allow logged-out visitors to create a page', async () => {
		const { community } = models;
		const agent = await login();
		await agent
			.post('/api/pages')
			.send({ communityId: community.id, title: 'Hey, a page', slug: 'hey-a-page' })
			.expect(403);
	});

	it('does not allow random users to create a page', async () => {
		const { community, randomUser } = models;
		const agent = await login(randomUser);
		await agent
			.post('/api/pages')
			.send({ communityId: community.id, title: 'Hey, a page', slug: 'hey-a-page' })
			.expect(403);
	});

	it('allows a Community manager to create a Page', async () => {
		const { community, communityManager } = models;
		const agent = await login(communityManager);
		const { body: page } = await expectCreatedActivityItem(
			agent
				.post('/api/pages')
				.send({ communityId: community.id, title: 'Hey, a page', slug: 'hey-a-page' })
				.expect(201),
		).toMatchResultingObject((response) => ({
			kind: 'page-created',
			actorId: communityManager.id,
			payload: {
				page: {
					id: response.body.id,
					title: 'Hey, a page',
				},
			},
		}));
		const createdPage = await Page.findOne({
			where: {
				id: page.id,
			},
		});
		expect(createdPage).toBeTruthy();
	});

	it('allows a Community manager to update the layout of a page', async () => {
		const { community, communityManager, page } = models;

		const agent = await login(communityManager);

		await agent
			.put(`/api/pages`)
			.send({ pageId: page.id, layout: [], communityId: community.id })
			.expect(201);
	});

	it('does not allow allow a Community member to delete, create, or update a page', async () => {
		const { community, communityMember, page } = models;

		const agent = await login(communityMember);

		await agent
			.post('/api/pages')
			.send({ communityId: community.id, title: 'Hey, a page', slug: 'hey-a-page' })
			.expect(403);

		await agent
			.put(`/api/pages`)
			.send({ pageId: page.id, layout: [], communityId: community.id })
			.expect(403);

		await agent
			.delete(`/api/pages`)
			.send({ pageId: page.id, communityId: community.id })
			.expect(403);
	});

	it('validates the layout properly', async () => {
		const { community, communityManager, page } = models;

		const agent = await login(communityManager);

		const layout = [
			{
				type: 'html',
				content: {
					html: '<p>foo</p>',
				},
			},
			{
				type: 'text',
				content: {
					align: 'center',
					text: {
						type: 'doc',
						content: [],
						attrs: {},
					},
				},
			},
		] satisfies z.input<typeof layoutBlockSchema>[];

		await agent
			.put(`/api/pages`)
			.send({ pageId: page.id, layout: ['foo', 'bar'], communityId: community.id })
			.expect(400);

		await agent
			.put(`/api/pages`)
			.send({ pageId: page.id, layout, communityId: community.id })
			.expect(201);
	});

	it('allows a Community manager to delete a page', async () => {
		const { community, communityManager, page } = models;

		const agent = await login(communityManager);

		await agent
			.delete(`/api/pages`)
			.send({ pageId: page.id, communityId: community.id })
			.expect(201);
	});
});
