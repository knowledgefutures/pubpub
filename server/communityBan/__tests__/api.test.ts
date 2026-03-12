import { vi } from 'vitest';

import { CommunityBan, SpamTag, User } from 'server/models';
import { login, modelize, setup, teardown } from 'stubstub';

vi.mock('server/spamTag/notifications/slack', () => ({
	postToSlackAboutCommunityFlag: vi.fn(),
	postToSlackAboutNewUserSpamTag: vi.fn(),
}));

vi.mock('server/spamTag/notifications/email', () => ({
	sendNewSpamTagDevEmail: vi.fn(),
	sendCommunityFlagDevEmail: vi.fn(),
	sendCommunityFlagResolvedEmail: vi.fn(),
}));

const models = modelize`
	User superadmin {
		isSuperAdmin: true
	}
	Community community {
		Pub pub {
			Member {
				permissions: "admin"
				User pubAdmin {}
			}

			Release release {
				historyKey: 10
			}
		}
		Member {
			permissions: "admin"
			User admin {}
		}
		Member {
			permissions: "view"
			User viewer {}
		}
	}
	User targetUser {}
`;

setup(beforeAll, async () => {
	await models.resolve();
});

teardown(afterAll);

it('allows a community admin to create a moderation ban and auto-creates a spam tag', async () => {
	const { admin, community, targetUser } = models;
	const agent = await login(admin);

	const res = await agent
		.post('/api/communityBans')
		.send({
			userId: targetUser.id,
			communityId: community.id,
			reason: 'spam-content',
			reasonText: 'looks like spam',
		})
		.expect(201);

	expect(res.body.userId).toEqual(targetUser.id);
	expect(res.body.communityId).toEqual(community.id);
	expect(res.body.reason).toEqual('spam-content');
	expect(res.body.status).toEqual('active');
	expect(res.body.spamTagId).toBeTruthy();

	const refreshedUser = await User.findByPk(targetUser.id);
	expect(refreshedUser?.spamTagId).toBeTruthy();
	const tag = await SpamTag.findByPk(res.body.spamTagId);
	expect(tag).toBeTruthy();
	expect(tag?.status).toEqual('unreviewed');
});

it('forbids non-admins from creating a moderation ban', async () => {
	const { viewer, community, targetUser } = models;
	const agent = await login(viewer);

	await agent
		.post('/api/communityBans')
		.send({
			userId: targetUser.id,
			communityId: community.id,
			reason: 'harassment',
		})
		.expect(403);
});

it('allows a community admin to retract their own ban', async () => {
	const { admin, community, targetUser } = models;
	const agent = await login(admin);

	const createRes = await agent
		.post('/api/communityBans')
		.send({
			userId: targetUser.id,
			communityId: community.id,
			reason: 'hateful-language',
		})
		.expect(201);

	const banId = createRes.body.id;

	await agent.put(`/api/communityBans/${banId}`).send({ status: 'retracted' }).expect(200);

	const ban = await CommunityBan.findByPk(banId);
	expect(ban?.status).toEqual('retracted');
});

it('blocks a banned user from creating discussions in that community', async () => {
	const { admin, community, targetUser, pub } = models;
	const adminAgent = await login(admin);

	await adminAgent
		.post('/api/communityBans')
		.send({
			userId: targetUser.id,
			communityId: community.id,
			reason: 'spam-content',
		})
		.expect(201);

	const targetAgent = await login(targetUser);

	// the targetUser should be blocked from creating discussions in this community
	await targetAgent
		.post('/api/discussions')
		.send({
			pubId: pub.id,
			communityId: community.id,
			content: { type: 'doc', content: [] },
			text: 'test',
		})
		.expect(403);
});

it('rejects status updates other than retracted', async () => {
	const { admin, community, targetUser } = models;
	const agent = await login(admin);

	const createRes = await agent
		.post('/api/communityBans')
		.send({
			userId: targetUser.id,
			communityId: community.id,
			reason: 'other',
		})
		.expect(201);

	await agent
		.put(`/api/communityBans/${createRes.body.id}`)
		.send({ status: 'dismissed' })
		.expect(400);

	await agent
		.put(`/api/communityBans/${createRes.body.id}`)
		.send({ status: 'escalated' })
		.expect(400);

	await agent
		.put(`/api/communityBans/${createRes.body.id}`)
		.send({ status: 'retracted' })
		.expect(200);
});

it('retracting a ban re-enables the user to create thread comments', async () => {
	const { admin, community, targetUser, pub } = models;
	const adminAgent = await login(admin);

	await adminAgent
		.post('/api/communityBans')
		.send({
			userId: targetUser.id,
			communityId: community.id,
			reason: 'other',
			reasonText: 'testing retraction',
		})
		.expect(201);

	const activeBans = await CommunityBan.findAll({
		where: {
			userId: targetUser.id,
			communityId: community.id,
			status: 'active',
		},
	});

	expect(activeBans.length).toBeGreaterThan(0);

	await Promise.all(
		activeBans.map((ban) =>
			adminAgent
				.put(`/api/communityBans/${ban.id}`)
				.send({ status: 'retracted' })
				.expect(200),
		),
	);

	const remaining = await CommunityBan.count({
		where: {
			userId: targetUser.id,
			communityId: community.id,
			status: 'active',
		},
	});
	expect(remaining).toEqual(0);

	const targetAgent = await login(targetUser);
	await targetAgent
		.post('/api/discussions')
		.send({
			pubId: pub.id,
			communityId: community.id,
			content: { type: 'doc', content: [] },
			text: 'test',
			// weird, why does the client need to set this?
			visibilityAccess: 'public',
		})
		.expect(201);
});
