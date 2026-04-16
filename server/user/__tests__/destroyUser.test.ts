/**
 * Integration tests for user account deletion.
 *
 * Run with: pnpm test-no-lint -- server/user/__tests__/destroyUser.test.ts
 */
import encHex from 'crypto-js/enc-hex';
import SHA3 from 'crypto-js/sha3';

import {
	CollectionAttribution,
	Community,
	Discussion,
	Member,
	Pub,
	PubAttribution,
	Release,
	ThreadComment,
	User,
} from 'server/models';
import { DELETED_USER_ID } from 'server/utils/systemEntities';
import { login, modelize, setup, teardown } from 'stubstub';

// ---------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------
const userToDeleteEmail = `delete-me-${crypto.randomUUID()}@example.com`;

const models = modelize`
	Community community {
		Member {
			permissions: "admin"
			User communityAdmin {}
		}
		Member communityMembership {
			permissions: "edit"
			User userToDelete {
				email: ${userToDeleteEmail}
				password: "password123"
			}
		}
		Pub pubWithAttribution {
			doi: "10.1234/test-user-delete"
			PubAttribution userAttribution {
				isAuthor: true
			}
			Release pubRelease {}
			Discussion userDiscussion {
				number: 1
				Visibility {}
				Thread discussionThread {
					ThreadComment userComment {
						text: "A comment by the user being deleted"
					}
					ThreadComment otherComment {
						text: "A comment by someone else"
					}
				}
			}
		}
		Pub pubWithoutDoi {
			PubAttribution userAttributionNoDoi {
				isAuthor: true
			}
		}
		Collection collection {
			CollectionAttribution userCollectionAttribution {
				isAuthor: true
			}
		}
	}
	User outsider {}
`;

// Ensure sentinel user exists
setup(beforeAll, async () => {
	await User.findOrCreate({
		where: { id: DELETED_USER_ID },
		defaults: {
			id: DELETED_USER_ID,
			slug: 'deleted-user',
			firstName: 'Deleted',
			lastName: 'User',
			fullName: 'Deleted User',
			initials: 'DU',
			email: 'deleted@pubpub.org',
			hash: '',
			salt: '',
			isSuperAdmin: false,
			gdprConsent: false,
		} as any,

		hooks: false,
	});
	await models.resolve();

	// Manually link attributions/discussion/comments to the user being deleted
	// (the modelize DSL creates them but may not auto-link userId for attributions
	//  and comments since they're nested under Pub, not directly under User)
	const { userToDelete, userAttribution, userAttributionNoDoi, userCollectionAttribution } =
		models;
	await PubAttribution.update({ userId: userToDelete.id }, { where: { id: userAttribution.id } });
	await PubAttribution.update(
		{ userId: userToDelete.id },
		{ where: { id: userAttributionNoDoi.id } },
	);
	await CollectionAttribution.update(
		{ userId: userToDelete.id },
		{ where: { id: userCollectionAttribution.id } },
	);
	await Discussion.update(
		{ userId: userToDelete.id },
		{ where: { id: models.userDiscussion.id } },
	);
	await ThreadComment.update(
		{ userId: userToDelete.id },
		{ where: { id: models.userComment.id } },
	);
	await Release.update({ userId: userToDelete.id }, { where: { id: models.pubRelease.id } });
	// Leave otherComment's userId as-is (the modelize builder may have set it to
	// a pub creator user or left it null — that's fine)
});

teardown(afterAll);

// ---------------------------------------------------------------
// Tests
// ---------------------------------------------------------------
describe('GET /api/account/deletionAudit', () => {
	it('rejects unauthenticated requests', async () => {
		const agent = await login();
		await agent.get('/api/account/deletionAudit').expect(403);
	});

	it('returns a correct audit for the logged-in user', async () => {
		const { userToDelete } = models;
		const agent = await login(userToDelete);
		const { body } = await agent.get('/api/account/deletionAudit').expect(200);

		expect(body.userId).toEqual(userToDelete.id);
		expect(body.fullName).toEqual(userToDelete.fullName);
		expect(body.pubAttributionCount).toBeGreaterThanOrEqual(2);
		expect(body.commentCount).toBeGreaterThanOrEqual(1);
		expect(body.soleAdminCommunities).toBeDefined();
	});
});

describe('DELETE /api/account', () => {
	it('rejects unauthenticated requests', async () => {
		const agent = await login();
		await agent
			.delete('/api/account')
			.send({ password: SHA3('password123').toString(encHex) })
			.expect(403);
	});

	it('rejects incorrect password', async () => {
		const { userToDelete } = models;
		const agent = await login(userToDelete);
		await agent
			.delete('/api/account')
			.send({ password: SHA3('wrongpassword').toString(encHex) })
			.expect(403);
	});
});

describe('User account deletion end-to-end', () => {
	it('deletes user, preserves attributions with name, anonymizes discussions', async () => {
		const {
			userToDelete,
			userAttribution,
			userAttributionNoDoi,
			userCollectionAttribution,
			userDiscussion,
			userComment,
			otherComment,
			pubRelease,
			pubWithAttribution,
			pubWithoutDoi,
			communityMembership,
			community,
		} = models;

		// Capture user info before deletion
		const userFullName = userToDelete.fullName;

		const agent = await login(userToDelete);

		// Perform deletion
		const { body } = await agent
			.delete('/api/account')
			.send({ password: SHA3('password123').toString(encHex) })
			.expect(200);

		expect(body.success).toBe(true);

		// ---- User should be gone ----
		const deletedUser = await User.findByPk(userToDelete.id);
		expect(deletedUser).toBeNull();

		// ---- PubAttribution should survive with name copied ----
		const preservedAttribution = await PubAttribution.findByPk(userAttribution.id);
		expect(preservedAttribution).not.toBeNull();
		expect(preservedAttribution!.userId).toBeNull();
		expect(preservedAttribution!.name).toEqual(userFullName);
		expect(preservedAttribution!.isAuthor).toBe(true);

		// ---- Attribution on non-DOI pub should ALSO survive ----
		const preservedAttrNoDoi = await PubAttribution.findByPk(userAttributionNoDoi.id);
		expect(preservedAttrNoDoi).not.toBeNull();
		expect(preservedAttrNoDoi!.userId).toBeNull();
		expect(preservedAttrNoDoi!.name).toEqual(userFullName);

		// ---- CollectionAttribution should survive with name copied ----
		const preservedCollAttr = await CollectionAttribution.findByPk(
			userCollectionAttribution.id,
		);
		expect(preservedCollAttr).not.toBeNull();
		expect(preservedCollAttr!.userId).toBeNull();
		expect(preservedCollAttr!.name).toEqual(userFullName);

		// ---- Discussion should survive but be reassigned to sentinel ----
		const anonymizedDiscussion = await Discussion.findByPk(userDiscussion.id);
		expect(anonymizedDiscussion).not.toBeNull();
		expect(anonymizedDiscussion!.userId).toEqual(DELETED_USER_ID);

		// ---- User's comment should survive but be reassigned to sentinel ----
		const anonymizedComment = await ThreadComment.findByPk(userComment.id);
		expect(anonymizedComment).not.toBeNull();
		expect(anonymizedComment!.userId).toEqual(DELETED_USER_ID);
		expect(anonymizedComment!.text).toEqual('A comment by the user being deleted');

		// ---- Other user's comment should be completely unaffected ----
		const untouchedComment = await ThreadComment.findByPk(otherComment.id);
		expect(untouchedComment).not.toBeNull();
		expect(untouchedComment!.text).toEqual('A comment by someone else');

		// ---- Release should survive with sentinel userId ----
		const preservedRelease = await Release.findByPk(pubRelease.id);
		expect(preservedRelease).not.toBeNull();
		expect(preservedRelease!.userId).toEqual(DELETED_USER_ID);

		// ---- Pubs themselves should be completely unaffected ----
		const pub1 = await Pub.findByPk(pubWithAttribution.id);
		expect(pub1).not.toBeNull();

		const pub2 = await Pub.findByPk(pubWithoutDoi.id);
		expect(pub2).not.toBeNull();

		// ---- Membership should be gone (CASCADE) ----
		const deletedMembership = await Member.findByPk(communityMembership.id);
		expect(deletedMembership).toBeNull();

		// ---- Community should be entirely unaffected ----
		const untouchedCommunity = await Community.findByPk(community.id);
		expect(untouchedCommunity).not.toBeNull();
	});
});
