import uuid from 'uuid';
import { vi } from 'vitest';

import { Community, SpamTag } from 'server/models';
import { finishDeferredTasks } from 'server/utils/deferred';
import { expectCreatedActivityItem, login, modelize, setup, teardown } from 'stubstub';

const models = modelize`
	Community existingCommunity {
		Member {
			permissions: "admin"
			User admin {}
		}
	}
	Community someOtherCommunity {
		Member {
			permissions: "admin"
			User someOtherAdmin {}
		}
	}
	User willNotCreateCommunity {
	}
	User superAdmin {
		isSuperAdmin: true
	}
`;

const { subscribeUser, postToSlackAboutNewCommunity } = vi.hoisted(() => {
	return {
		subscribeUser: vi.fn(),
		postToSlackAboutNewCommunity: vi.fn(),
	};
});

setup(beforeAll, async () => {
	vi.mock('server/utils/mailchimp', () => ({
		subscribeUser,
	}));
	vi.mock('server/utils/slack', () => ({
		postToSlackAboutNewCommunity,
	}));

	await models.resolve();
});

const getHost = (community) => `${community.subdomain}.pubpub.org`;

describe('/api/communities', () => {
	it('gets a community by id', async () => {
		const { existingCommunity, admin } = models;
		const agent = await login(admin);
		const { body: community } = await agent
			.get(`/api/communities/${existingCommunity.id}`)
			.expect(200);
		expect(community.id).toEqual(existingCommunity.id);
	});

	it('returns the current community from /api/communities', async () => {
		const { existingCommunity } = models;

		const agent = await login();

		const { body: communities } = await agent
			.get('/api/communities')
			.set('Host', getHost(existingCommunity))
			.expect(200);

		expect(communities).toHaveLength(1);

		const [community] = communities;

		expect(community.id).toEqual(existingCommunity.id);
	});

	it('creates a community if you are a superAdmin', async () => {
		const { superAdmin } = models;
		const agent = await login(superAdmin);
		const subdomain = 'burn-book-' + uuid.v4();
		const { body: url } = await expectCreatedActivityItem(
			agent
				.post('/api/communities')
				.send({
					subdomain,
					title: 'Burn Book',
					description: "Get in loser we're testing our code",
					accentColorLight: '#FFFFFF',
					accentColorDark: '#2D2E2F',
				})
				.expect(201),
		).toMatchResultingObject((response) => ({
			kind: 'community-created',
			communityId: response.body.id,
			actorId: superAdmin.id,
		}));
		const newCommunity = await Community.findOne({ where: { subdomain } });
		expect(newCommunity?.title).toEqual('Burn Book');
		// in non-prod, the handler returns the local dev URL
		expect(url).toEqual('http://localhost:9876');
	});

	it('creates a community if you are a regular logged-in user', async () => {
		const { willNotCreateCommunity } = models;
		const agent = await login(willNotCreateCommunity);
		const subdomain = 'regular-user-' + uuid.v4();
		await agent
			.post('/api/communities')
			.send({
				subdomain,
				title: 'Journal of Regular Users',
				description: 'anyone can create a community',
				accentColorLight: '#FFFFFF',
				accentColorDark: '#2D2E2F',
			})
			.expect(201);
		const newCommunity = await Community.findOne({ where: { subdomain } });
		expect(newCommunity?.title).toEqual('Journal of Regular Users');
	});

	it('does not create a community if you are logged out', async () => {
		await (await login())
			.post('/api/communities')
			.send({
				subdomain: 'notloggedin',
				title: 'Journal of Forgetting To Log In First',
				description: 'oops, I forgot',
				accentColorLight: '#FFFFFF',
				accentColorDark: '#2D2E2F',
			})
			.expect(403);
	});

	it('does not allow admins of other communities to update fields on a community', async () => {
		const { existingCommunity, someOtherAdmin } = models;
		const { title: oldTitle, id: communityId } = existingCommunity;
		const agent = await login(someOtherAdmin);
		await agent
			.put('/api/communities')
			.send({
				communityId,
				title: 'I Hear She Does Car Commericals, In Japan',
			})
			.expect(403);
		const communityNow = await Community.findOne({ where: { id: communityId } });
		expect(communityNow?.title).toEqual(oldTitle);
	});

	it('allows community admins to update reasonable fields on the community', async () => {
		const { admin, existingCommunity } = models;
		const agent = await login(admin);
		await expectCreatedActivityItem(
			agent
				.put('/api/communities')
				.send({
					communityId: existingCommunity.id,
					// We expect this field to be updated...
					title: 'Journal of Trying To Lose Three Pounds',
					// ...but not this one!
					isFeatured: true,
				})
				.expect(200),
		).toMatchObject({
			kind: 'community-updated',
			communityId: existingCommunity.id,
			actorId: admin.id,
		});
		const communityNow = await Community.findOne({ where: { id: existingCommunity.id } });
		expect(communityNow?.title).toEqual('Journal of Trying To Lose Three Pounds');
		expect(communityNow?.isFeatured).not.toBeTruthy();
	});

	it('blocks non-members from accessing an unreviewed community', async () => {
		const { willNotCreateCommunity } = models;
		const creator = await login(willNotCreateCommunity);
		const subdomain = 'unreviewed-test-' + uuid.v4();

		await creator
			.post('/api/communities')
			.send({
				subdomain,
				title: 'Unreviewed Community',
				description: 'Testing unreviewed visibility',
				accentColorLight: '#FFFFFF',
				accentColorDark: '#2D2E2F',
			})
			.expect(201);
		await finishDeferredTasks();

		const newCommunity = await Community.findOne({
			where: { subdomain },
			include: [{ model: SpamTag, as: 'spamTag' }],
		});
		expect(newCommunity?.spamTag?.status).toEqual('unreviewed');

		const host = `${subdomain}.pubpub.org`;

		// unauthenticated users cannot access the community
		const anonAgent = await login();
		await anonAgent.get('/').set('Host', host).expect(404);

		// the creating member (auto-added as admin) can still access it
		await creator.get('/').set('Host', host).expect(200);
	});
});

teardown(afterAll, () => {
	vi.clearAllMocks();
	vi.resetAllMocks();
});
