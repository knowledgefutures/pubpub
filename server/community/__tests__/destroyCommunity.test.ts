/**
 * Integration tests for community deletion and user account deletion.
 *
 * Run with: pnpm test-no-lint -- server/community/__tests__/destroyCommunity.test.ts
 * Or:       pnpm test-no-lint -- server/user/__tests__/destroyUser.test.ts
 *
 * (Or run both together — they're independent files.)
 */
import {
	Collection,
	CollectionAttribution,
	Community,
	Discussion,
	Member,
	Page,
	Pub,
	PubAttribution,
	Release,
	Thread,
	ThreadComment,
} from 'server/models';
import { ARCHIVE_COMMUNITY_ID } from 'server/utils/systemEntities';
import { login, modelize, setup, teardown } from 'stubstub';

// ---------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------
const models = modelize`
	Community communityToDelete {
		Member {
			permissions: "admin"
			User communityAdmin {}
		}
		Member {
			permissions: "edit"
			User communityEditor {}
		}
		Page homePage {
			title: "Home"
			slug: "home"
		}
		Collection collection {
			CollectionAttribution collectionAttribution {
				name: "Some Author"
				isAuthor: true
			}
		}
		Pub pubWithDoi {
			doi: "10.1234/test-doi-pub"
			PubAttribution doiPubAttribution {
				name: "DOI Author"
				isAuthor: true
			}
			Release doiPubRelease {}
			Discussion doiPubDiscussion {
				number: 1
				Visibility {}
				Thread doiPubThread {
					ThreadComment doiPubComment {
						text: "This is a comment on a DOI pub"
					}
				}
			}
		}
		Pub pubWithoutDoi {
			PubAttribution noDotPubAttribution {
				name: "No DOI Author"
				isAuthor: true
			}
			Discussion noDotPubDiscussion {
				number: 1
				Visibility {}
				Thread noDotPubThread {
					ThreadComment noDotPubComment {
						text: "This is a comment on a non-DOI pub"
					}
				}
			}
		}
	}
	Community communityNotDeleted {
		Member {
			permissions: "admin"
			User otherAdmin {}
		}
		Pub survivingPub {}
	}
	User outsider {}
`;

setup(beforeAll, async () => {
	// Ensure the archive community exists for the test.
	// hooks:false prevents the afterCreate hook from running summarizeCommunity(),
	// which would fail because findOrCreate's internal transaction hasn't committed yet.
	await Community.findOrCreate({
		where: { id: ARCHIVE_COMMUNITY_ID },
		defaults: {
			id: ARCHIVE_COMMUNITY_ID,
			subdomain: 'archive',
			title: 'PubPub Archive',
		} as any,
		hooks: false,
	});
	await models.resolve();
});

teardown(afterAll);

const getHost = (community) => `${community.subdomain}.pubpub.org`;

// ---------------------------------------------------------------
// Tests
// ---------------------------------------------------------------
describe('DELETE /api/communities/:id', () => {
	it('rejects unauthenticated requests', async () => {
		const { communityToDelete } = models;
		const agent = await login();
		await agent
			.delete(`/api/communities/${communityToDelete.id}`)
			.set('Host', getHost(communityToDelete))
			.send({ confirmationTitle: communityToDelete.title })
			.expect(403);
	});

	it('rejects non-admin users', async () => {
		const { communityToDelete, outsider } = models;
		const agent = await login(outsider);
		await agent
			.delete(`/api/communities/${communityToDelete.id}`)
			.set('Host', getHost(communityToDelete))
			.send({ confirmationTitle: communityToDelete.title })
			.expect(403);
	});

	it('rejects community editors (not admin)', async () => {
		const { communityToDelete, communityEditor } = models;
		const agent = await login(communityEditor);
		await agent
			.delete(`/api/communities/${communityToDelete.id}`)
			.set('Host', getHost(communityToDelete))
			.send({ confirmationTitle: communityToDelete.title })
			.expect(403);
	});

	it('rejects if confirmation title does not match', async () => {
		const { communityToDelete, communityAdmin } = models;
		const agent = await login(communityAdmin);
		await agent
			.delete(`/api/communities/${communityToDelete.id}`)
			.set('Host', getHost(communityToDelete))
			.send({ confirmationTitle: 'wrong title' })
			.expect(400);
	});
});

describe('GET /api/communities/:id/deletionAudit', () => {
	it('returns a correct audit for a community with DOI and non-DOI pubs', async () => {
		const { communityToDelete, communityAdmin } = models;
		const agent = await login(communityAdmin);
		const { body } = await agent
			.get(`/api/communities/${communityToDelete.id}/deletionAudit`)
			.set('Host', getHost(communityToDelete))
			.expect(200);

		expect(body.communityId).toEqual(communityToDelete.id);
		expect(body.totalPubs).toEqual(2);
		expect(body.pubsWithDoi).toEqual(1);
		expect(body.pubsWithoutDoi).toEqual(1);
	});
});

describe('Community deletion end-to-end', () => {
	it('deletes community, archives DOI pubs, hard-deletes non-DOI pubs', async () => {
		const {
			communityToDelete,
			communityAdmin,
			pubWithDoi,
			pubWithoutDoi,
			doiPubAttribution,
			doiPubRelease,
			doiPubDiscussion,
			doiPubThread,
			doiPubComment,
			noDotPubAttribution,
			noDotPubDiscussion,
			noDotPubThread,
			noDotPubComment,
			collection,
			homePage,
			communityNotDeleted,
			survivingPub,
		} = models;

		const agent = await login(communityAdmin);

		// Perform deletion
		const { body } = await agent
			.delete(`/api/communities/${communityToDelete.id}`)
			.set('Host', getHost(communityToDelete))
			.send({ confirmationTitle: communityToDelete.title })
			.expect(200);

		expect(body.success).toBe(true);

		// ---- Community should be gone ----
		const deletedCommunity = await Community.findByPk(communityToDelete.id);
		expect(deletedCommunity).toBeNull();

		// ---- DOI pub should be moved to archive community ----
		const archivedPub = await Pub.findByPk(pubWithDoi.id);
		expect(archivedPub).not.toBeNull();
		expect(archivedPub!.communityId).toEqual(ARCHIVE_COMMUNITY_ID);
		expect(archivedPub!.doi).toEqual('10.1234/test-doi-pub');

		// ---- DOI pub's children should survive ----
		const archivedAttribution = await PubAttribution.findByPk(doiPubAttribution.id);
		expect(archivedAttribution).not.toBeNull();

		const archivedRelease = await Release.findByPk(doiPubRelease.id);
		expect(archivedRelease).not.toBeNull();

		const archivedDiscussion = await Discussion.findByPk(doiPubDiscussion.id);
		expect(archivedDiscussion).not.toBeNull();

		const archivedThread = await Thread.findByPk(doiPubThread.id);
		expect(archivedThread).not.toBeNull();

		const archivedComment = await ThreadComment.findByPk(doiPubComment.id);
		expect(archivedComment).not.toBeNull();
		expect(archivedComment!.text).toEqual('This is a comment on a DOI pub');

		// ---- Non-DOI pub should be hard deleted ----
		const deletedPub = await Pub.findByPk(pubWithoutDoi.id);
		expect(deletedPub).toBeNull();

		const deletedAttribution = await PubAttribution.findByPk(noDotPubAttribution.id);
		expect(deletedAttribution).toBeNull();

		const deletedDiscussion = await Discussion.findByPk(noDotPubDiscussion.id);
		expect(deletedDiscussion).toBeNull();

		const deletedThread = await Thread.findByPk(noDotPubThread.id);
		expect(deletedThread).toBeNull();

		const deletedComment = await ThreadComment.findByPk(noDotPubComment.id);
		expect(deletedComment).toBeNull();

		// ---- Collection and Page should be gone ----
		const deletedCollection = await Collection.findByPk(collection.id);
		expect(deletedCollection).toBeNull();

		const deletedPage = await Page.findByPk(homePage.id);
		expect(deletedPage).toBeNull();

		// ---- Other community should be completely unaffected ----
		const otherCommunity = await Community.findByPk(communityNotDeleted.id);
		expect(otherCommunity).not.toBeNull();

		const otherPub = await Pub.findByPk(survivingPub.id);
		expect(otherPub).not.toBeNull();
	});
});
