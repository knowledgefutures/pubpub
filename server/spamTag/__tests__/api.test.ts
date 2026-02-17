import { vi } from 'vitest';

import { SpamTag } from 'server/models';
import { login, modelize, setup, teardown } from 'stubstub';

import { addSpamTagToCommunity } from '../queries';

const {
	sendCommunityApprovedEmail,
	sendCommunityRejectedAsSpamEmail,
	postToSlackAboutCommunityStatusChange,
} = vi.hoisted(() => ({
	sendCommunityApprovedEmail: vi.fn(),
	sendCommunityRejectedAsSpamEmail: vi.fn(),
	postToSlackAboutCommunityStatusChange: vi.fn(),
}));

let spamTag;

const models = modelize`
	User superadmin {
        isSuperAdmin: true
    }
    Community community {
        Member {
            permissions: "admin"
            User admin {}
        }
    }
`;

setup(beforeAll, async () => {
	vi.mock('server/utils/email/communitySpam', () => ({
		sendCommunityApprovedEmail,
		sendCommunityRejectedAsSpamEmail,
	}));
	vi.mock('server/utils/slack', () => ({
		postToSlackAboutCommunityStatusChange,
	}));

	await models.resolve();
	spamTag = await addSpamTagToCommunity(models.community.id);
	await spamTag.update({ status: 'confirmed-spam' });
});

teardown(afterAll);

it('forbids non-superadmins from updating the SpamTag.status for a Community', async () => {
	const { admin, community } = models;
	const agent = await login(admin);
	await agent
		.put('/api/spamTags')
		.send({ communityId: community.id, status: 'confirmed-not-spam' })
		.expect(403);
	expect((await SpamTag.findOne({ where: { id: spamTag.id } }))?.status).toEqual(
		'confirmed-spam',
	);
});

it('allows superadmins to update the SpamTag.status for a Community', async () => {
	const { superadmin, community } = models;
	const agent = await login(superadmin);
	await agent
		.put('/api/spamTags')
		.send({ communityId: community.id, status: 'confirmed-not-spam' })
		.expect(200);
	expect((await SpamTag.findOne({ where: { id: spamTag.id } }))?.status).toEqual(
		'confirmed-not-spam',
	);
});
