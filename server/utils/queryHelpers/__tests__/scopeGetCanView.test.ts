import { getScope } from 'server/utils/queryHelpers';
import { modelize, setup, teardown } from 'stubstub';

/**
 * `canView` is the predicate the CMS-mode gate wants to key on, so pin down
 * exactly what raises it: membership, a matching access hash, or superadmin --
 * and NOT a pub being released or carrying public permissions.
 */
const models = modelize`
	Community community {
		Member {
			permissions: "view"
			User communityViewer {}
		}
		Pub releasedPub {
			slug: "released-pub"
			viewHash: "view-hash-abc"
			commentHash: "comment-hash-abc"
			Release {}
		}
		Pub draftPub {
			slug: "draft-pub"
			viewHash: "draft-view-hash"
		}
	}
	User randomLoggedInUser {}
`;

setup(beforeAll, async () => {
	await models.resolve();
	const { releasedPub, community } = models;
	// The most permissive public permissions PubPub can express, at both the
	// pub and community level.
	const { PublicPermissions } = await import('server/models');
	await PublicPermissions.create({
		pubId: releasedPub.id,
		canCreateReviews: true,
		canCreateDiscussions: true,
		discussionCreationAccess: 'public',
		canViewDraft: true,
		canEditDraft: true,
	});
	await PublicPermissions.create({
		communityId: community.id,
		canCreateReviews: true,
		canCreateDiscussions: true,
		discussionCreationAccess: 'public',
		canViewDraft: true,
		canEditDraft: true,
	});
});

teardown(afterAll);

const scopeFor = (opts: { pubSlug?: string; accessHash?: string; loginId?: string | null }) =>
	getScope({
		communityId: models.community.id,
		pubSlug: opts.pubSlug,
		accessHash: opts.accessHash ?? null,
		loginId: opts.loginId ?? null,
	});

describe('canView is not granted by release or public permissions', () => {
	it('is false for an anonymous visitor to a RELEASED pub with public permissions', async () => {
		const { activePermissions } = await scopeFor({ pubSlug: 'released-pub' });
		expect(activePermissions.canView).toEqual(false);
		expect(activePermissions.activePermission).toEqual(null);
		// ...even though the public permissions really did apply:
		expect(activePermissions.canViewDraft).toEqual(true);
		expect(activePermissions.canCreateDiscussions).toEqual(true);
	});

	it('is false for a logged-in non-member on the same released pub', async () => {
		const { activePermissions } = await scopeFor({
			pubSlug: 'released-pub',
			loginId: models.randomLoggedInUser.id,
		});
		expect(activePermissions.canView).toEqual(false);
	});

	it('is false for an anonymous visitor to the community root', async () => {
		const { activePermissions } = await scopeFor({});
		expect(activePermissions.canView).toEqual(false);
	});

	it('is false when the access hash is wrong', async () => {
		const { activePermissions } = await scopeFor({
			pubSlug: 'released-pub',
			accessHash: 'not-the-right-hash',
		});
		expect(activePermissions.canView).toEqual(false);
	});
});

describe('canView IS granted by membership or a matching access hash', () => {
	it('is true for a community member with view permissions', async () => {
		const { activePermissions } = await scopeFor({
			pubSlug: 'released-pub',
			loginId: models.communityViewer.id,
		});
		expect(activePermissions.canView).toEqual(true);
	});

	it('is true for an anonymous holder of the pub viewHash', async () => {
		const { activePermissions } = await scopeFor({
			pubSlug: 'released-pub',
			accessHash: 'view-hash-abc',
		});
		expect(activePermissions.canView).toEqual(true);
	});

	it('is true for an anonymous holder of the pub commentHash', async () => {
		const { activePermissions } = await scopeFor({
			pubSlug: 'released-pub',
			accessHash: 'comment-hash-abc',
		});
		expect(activePermissions.canView).toEqual(true);
	});

	it("does not let one pub's hash unlock a different pub", async () => {
		const { activePermissions } = await scopeFor({
			pubSlug: 'draft-pub',
			accessHash: 'view-hash-abc',
		});
		expect(activePermissions.canView).toEqual(false);
	});
});
