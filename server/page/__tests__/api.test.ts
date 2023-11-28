import { Page } from 'server/models';
import { expectCreatedActivityItem, login, modelize, setup, teardown } from 'stubstub';
import { layoutBlockSchema } from 'utils/api/schemas/layout';
import { pageSchema } from 'utils/api/schemas/page';
import { z } from 'zod';

const models = modelize`
	Community community {
		Member {
			permissions: "admin"
			User admin {}
		}
		Member {
			permissions: "manage"
			User communityManager {}
		}
		Member {
			permissions: "edit"
			User communityMember {}
		}
		Page wow {
			title: "Wow, a page"
			slug: "wow"
		}
		Page {
			title: "Ew, another page"
			slug: "ew"
		}
		Page {
			title: "Hi"
			slug: "hi"
		}
		Page {
			title: "Against all odds, a page"
			slug: "against"
		}
        Page page {
            title: "Page"
            slug: "some-random-page"
        }
	}
	User randomUser {}
	User anotherRandomUser {}
	Community nefariousCommunity {
		Member {
			permissions: "admin"
			User nefariousAdmin {}
		}
	}
`;

setup(beforeAll, async () => {
	await models.resolve();
});

teardown(afterAll);

const getHost = (community: any) => `${community.subdomain}.pubpub.org`;

let adminAgent: Awaited<ReturnType<typeof login>>;

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

	describe('GET /api/pages', () => {
		beforeEach(async () => {
			adminAgent = await login(models.admin);
			adminAgent.set('Host', getHost(models.community));
		});

		it('should get a page by id', async () => {
			const { wow } = models;

			const { body } = await adminAgent.get(`/api/pages/${wow.id}`).expect(200);

			expect(body.title).toEqual(wow.title);
		});

		it('should get a page by slug', async () => {
			const { wow } = models;

			const { body } = await adminAgent.get(`/api/pages/${wow.slug}`).expect(200);

			expect(body.title).toEqual(wow.title);
		});

		it('should be able to include the community in the get response, but not do so by default', async () => {
			const { wow, community } = models;

			const { body } = await adminAgent.get(`/api/pages/${wow.id}`).expect(200);

			expect(body.community).toBeUndefined();

			const { body: bodyWithCommunity } = await adminAgent
				.get(`/api/pages/${wow.id}?include=${JSON.stringify(['community'])}`)
				.expect(200);

			expect(bodyWithCommunity.community).toBeDefined();
			expect(bodyWithCommunity.community.id).toEqual(community.id);
		});

		it('should throw a ForbiddenError for non-admin users', async () => {
			const { communityMember } = models;
			const agent = await login(communityMember);

			await agent.get('/api/pages').set('Host', getHost(models.community)).expect(403); // Forbidden
		});

		it('should only return pages from your community', async () => {
			const { nefariousAdmin, nefariousCommunity } = models;
			const agent = await login(nefariousAdmin);

			const { body } = await agent
				.get('/api/pages')
				.set('Host', getHost(nefariousCommunity))
				.expect(200);

			expect(body).toBeInstanceOf(Array);
			expect(body.length).toEqual(0);
		});

		it('should return pages with default query parameters', async () => {
			const { body } = await adminAgent.get('/api/pages').expect(200);

			expect(body).toBeInstanceOf(Array);
			expect(body.length).toBeLessThanOrEqual(10); // default limit
			expect(body.length).toBeGreaterThanOrEqual(1);
		});

		it('should return pages with custom query parameters', async () => {
			const { admin, community } = models;
			const agent = await login(admin);

			const { body } = await agent
				.get('/api/pages?limit=5&offset=5&sortBy=updatedAt&orderBy=ASC')
				.set('Host', getHost(community))
				.expect(200);

			expect(body).toBeInstanceOf(Array);
			expect(body.length).toBeLessThanOrEqual(5);
		});

		it('should return pages with a specific title', async () => {
			const { body } = await adminAgent
				.get(
					`/api/pages?filter=${encodeURIComponent(
						JSON.stringify({ title: { contains: 'Wow' } }),
					)}`,
				)
				.expect(200);

			expect(body).toBeInstanceOf(Array);
			expect(body.length).toBeGreaterThanOrEqual(1);
			body.forEach((page) => {
				expect(page.title).toBe('Wow, a page');
			});
		});

		it('should return pages that match the expected schema', async () => {
			const { body } = await adminAgent.get('/api/pages').expect(200);

			body.forEach((page) => {
				expect(() => pageSchema.parse(page)).not.toThrow();
			});
		});

		it('should order pages differently for different sort parameters', async () => {
			const { body: orderByTitle } = await adminAgent
				.get('/api/pages?sortBy=title')
				.expect(200);

			const { body: orderByUpdatedAt } = await adminAgent
				.get('/api/pages?sortBy=updatedAt')
				.expect(200);

			expect(orderByTitle[0].id).not.toEqual(orderByUpdatedAt[0].id);
		});

		it('should reverse the order of pages when changing sort order', async () => {
			const [{ body: orderAsc }, { body: orderDesc }] = await Promise.all([
				adminAgent.get('/api/pages?sortBy=slug&orderBy=ASC&limit=100').expect(200),

				adminAgent.get('/api/pages?sortBy=slug&orderBy=DESC&limit=100').expect(200),
			]);

			expect(orderAsc.length).toEqual(orderDesc.length);
			expect(orderAsc.at(0)).toEqual(orderDesc.at(-1));
			expect(orderAsc.at(1)).toEqual(orderDesc.at(-2));
		});

		it('should limit the number of pages returned', async () => {
			const limit = 3;

			const { body } = await adminAgent.get(`/api/pages?limit=${limit}`).expect(200);

			expect(body.length).toEqual(limit);
		});

		it('should return correct pages with offset and limit', async () => {
			const limit = 3;
			const offset = 0;

			const { body: firstPage } = await adminAgent
				.get(`/api/pages?limit=${limit}&offset=${offset}`)
				.expect(200);

			const { body: secondPage } = await adminAgent
				.get(`/api/pages?limit=${limit}&offset=${offset + limit}`)
				.expect(200);

			expect(firstPage.length).toEqual(limit);
			expect(secondPage.length).toBeLessThanOrEqual(limit);
			// Ensure no overlap in pages between pages
			const firstPageIds = firstPage.map((c) => c.id);
			const secondPageIds = secondPage.map((c) => c.id);
			const intersection = firstPageIds.filter((id) => secondPageIds.includes(id));

			expect(intersection.length).toEqual(0);
		});

		it('should do some sophisticated filtering', async () => {
			const filter = {
				slug: [{ contains: 'ew' }],
			};

			const { body } = await adminAgent
				.get(`/api/pages?filter=${encodeURIComponent(JSON.stringify(filter))}`)
				.expect(200);

			expect(body[0]?.slug).toEqual('ew');
		});

		it('should be able to filter without the filter query parameter', async () => {
			const [{ body: slugBod }, { body: titleBod }] = await Promise.all([
				adminAgent.get(`/api/pages?slug=ew`).expect(200),
				adminAgent.get(`/api/pages?title=Hi`).expect(200),
			]);

			expect(slugBod[0]?.slug).toEqual('ew');
			expect(titleBod[0]?.title).toEqual('Hi');
		});
	});
});
