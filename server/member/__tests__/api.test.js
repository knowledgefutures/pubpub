/* global expect, it, beforeAll, afterAll */
import { setup, teardown, login, modelize } from 'stubstub';

import { Member } from 'server/models';

const models = modelize`
    User willBeCommunityViewer {}
    User willBePubViewer {}
    User willBeCollectionManager {}
    User friendOfThePubAdmin {}
    Community community {
        Member communityManagerMember {
            permissions: "manage"
            User communityManager {}
        }
        Member disillusionedCommunityAdminMember {
            permissions: "manage"
            User disillusionedCommunityAdmin {}
        }
        Member communityViewerMember {
            permissions: "view"
            User communityViewer {}
        }
        Collection collection {
            Member youCanDemoteMe {
                permissions: "manage"
                User iCannotElevateYou {}
            }
            Member youCannotElevateMe {
                permissions: "manage"
                User iCanDemoteYou {}
            }
            Member aCommunityManagerCanPromoteMe {
                permissions: "view"
                User {}
            }
            Member {
                permissions: "manage"
                User iCanCreateAPubViewer {}
            }
            Member {
                permissions: "edit"
                User iCannotCreateAPubViewer {}
            }
            CollectionPub {
                Pub pub {
                    Member pubAdminMember {
                        permissions: "admin"
                        User pubAdmin {}
                    }
                    Member youCannotPromoteMeToAdmin {
                        permissions: "edit"
                        User {}
                    }
                    Member iWillBeDeleted {
                        permissions: "manage"
                        User {}
                    }
                }
            }
        }
        Collection someOtherCollection {
            Member {
                permissions: "admin"
                User iCannotCreateMemberInOtherScope {}
            }
        }
    }
    Community otherCommunity {
        Member {
            permissions: "admin"
            User otherCommunityAdmin {}
        }
    }
`;

setup(beforeAll, async () => {
	await models.resolve();
});

teardown(afterAll);

const createMemberRequest = ({ collection, pub, permissions, user, member }) => {
	const { community } = models;
	return {
		pubId: pub && pub.id,
		collectionId: collection && collection.id,
		communityId: community.id,
		targetUserId: user && user.id,
		id: member && member.id,
		value: { permissions: permissions },
	};
};

it('allows a member at the Community scope to add other Community members', async () => {
	const { communityManager, willBeCommunityViewer } = models;
	const agent = await login(communityManager);
	const { body: member } = await agent
		.post('/api/members')
		.send(createMemberRequest({ permissions: 'view', user: willBeCommunityViewer }))
		.expect(201);
	expect(member.userId).toEqual(willBeCommunityViewer.id);
});

it('prevents a member from elevating their own permissions', async () => {
	const {
		communityManager,
		communityViewer,
		communityManagerMember,
		communityViewerMember,
	} = models;
	await Promise.all(
		[
			[communityManager, communityManagerMember],
			[communityViewer, communityViewerMember],
		].map(async ([user, member]) =>
			(await login(user))
				.put('/api/members')
				.send(createMemberRequest({ permissions: 'admin', member: member }))
				.expect(403),
		),
	);
});

it('allows a member to reduce their own permissions', async () => {
	const { disillusionedCommunityAdmin, disillusionedCommunityAdminMember } = models;
	const agent = await login(disillusionedCommunityAdmin);
	const { body: member } = await agent
		.put('/api/members')
		.send(
			createMemberRequest({
				permissions: 'manage',
				member: disillusionedCommunityAdminMember,
			}),
		)
		.expect(200);
	expect(member.permissions).toEqual('manage');
});

it('prevents a member from elevating another member higher than their own permissions', async () => {
	const { collection, iCannotElevateYou, youCannotElevateMe } = models;
	const agent = await login(iCannotElevateYou);
	await agent
		.put('/api/members')
		.send(
			createMemberRequest({
				permissions: 'admin',
				collection: collection,
				member: youCannotElevateMe,
			}),
		)
		.expect(403);
});

it('allows a member to demote a peer of equal rank', async () => {
	const { collection, iCanDemoteYou, youCanDemoteMe } = models;
	const agent = await login(iCanDemoteYou);
	const { body: member } = await agent
		.put('/api/members')
		.send(
			createMemberRequest({
				permissions: 'edit',
				collection: collection,
				member: youCanDemoteMe,
			}),
		)
		.expect(200);
	expect(member.permissions).toEqual('edit');
});

it('prevents a Collection non-manager from creating a member in a Pub scope', async () => {
	const { iCannotCreateAPubViewer, willBePubViewer, collection, pub } = models;
	const agent = await login(iCannotCreateAPubViewer);
	await agent
		.post('/api/members')
		.send(
			createMemberRequest({
				permissions: 'view',
				collection: collection,
				pub: pub,
				user: willBePubViewer,
			}),
		)
		.expect(403);
});

it('prevents an admin of a collection from creating a member in a Pub that does not belong to the collection', async () => {
	const { iCannotCreateMemberInOtherScope, willBePubViewer, collection, pub } = models;
	const agent = await login(iCannotCreateMemberInOtherScope);
	await agent
		.post('/api/members')
		.send(
			createMemberRequest({
				permissions: 'view',
				collection: collection,
				pub: pub,
				user: willBePubViewer,
			}),
		)
		.expect(403);
});

it('allows a Community manager to create a member in a Collection scope', async () => {
	const { communityManager, willBeCollectionManager, collection } = models;
	const agent = await login(communityManager);
	const { body: member } = await agent
		.post('/api/members')
		.send(
			createMemberRequest({
				permissions: 'view',
				collection: collection,
				user: willBeCollectionManager,
			}),
		)
		.expect(201);
	expect(member.userId).toEqual(willBeCollectionManager.id);
});

it('allows a Collection manager to create a member in a Pub scope', async () => {
	const { iCanCreateAPubViewer, willBePubViewer, collection, pub } = models;
	const agent = await login(iCanCreateAPubViewer);
	const { body: member } = await agent
		.post('/api/members')
		.send(
			createMemberRequest({
				permissions: 'view',
				collection: collection,
				pub: pub,
				user: willBePubViewer,
			}),
		)
		.expect(201);
	expect(member.userId).toEqual(willBePubViewer.id);
});

it('prevents a Community manager from promoting a member to admin in a Collection scope', async () => {
	const { communityManager, youCanDemoteMe, collection } = models;
	const agent = await login(communityManager);
	await agent
		.put('/api/members')
		.send(
			createMemberRequest({
				permissions: 'admin',
				collection: collection,
				member: youCanDemoteMe,
			}),
		)
		.expect(403);
});

it('allows a Community manager to promote a member to manager in a Collection scope', async () => {
	const { communityManager, aCommunityManagerCanPromoteMe, collection } = models;
	const agent = await login(communityManager);
	const { body: member } = await agent
		.put('/api/members')
		.send(
			createMemberRequest({
				permissions: 'manage',
				collection: collection,
				member: aCommunityManagerCanPromoteMe,
			}),
		)
		.expect(200);
	expect(member.permissions).toEqual('manage');
});

it('prevents a Community manager from promoting a member to admin in a Collection scope', async () => {
	const { communityManager, youCanDemoteMe, collection } = models;
	const agent = await login(communityManager);
	await agent
		.put('/api/members')
		.send(
			createMemberRequest({
				permissions: 'admin',
				collection: collection,
				member: youCanDemoteMe,
			}),
		)
		.expect(403);
});

it('prevents a Collection manager from promoting a member to admin in a Pub scope', async () => {
	const { iCanCreateAPubViewer, youCannotPromoteMeToAdmin, collection, pub } = models;
	const agent = await login(iCanCreateAPubViewer);
	await agent
		.put('/api/members')
		.send(
			createMemberRequest({
				permissions: 'admin',
				collection: collection,
				pub: pub,
				member: youCannotPromoteMeToAdmin,
			}),
		)
		.expect(403);
});

it('allows a Collection manager to promote a member to manager in a Pub scope', async () => {
	const { iCanCreateAPubViewer, youCannotPromoteMeToAdmin, collection, pub } = models;
	const agent = await login(iCanCreateAPubViewer);
	const { body: member } = await agent
		.put('/api/members')
		.send(
			createMemberRequest({
				permissions: 'manage',
				collection: collection,
				pub: pub,
				member: youCannotPromoteMeToAdmin,
			}),
		)
		.expect(200);
	expect(member.permissions).toEqual('manage');
});

it('prevents a Pub admin from adding members at higher scopes', async () => {
	const { pubAdmin, friendOfThePubAdmin } = models;
	const agent = await login(pubAdmin);
	await agent
		.post('/api/members')
		.send(
			createMemberRequest({
				permissions: 'view',
				member: friendOfThePubAdmin,
			}),
		)
		.expect(403);
});

it('prevents Community admins from wreaking havoc on other Communities', async () => {
	const { otherCommunityAdmin, pub } = models;
	const agent = await login(otherCommunityAdmin);
	await agent
		.post('/api/members')
		.send(
			createMemberRequest({
				permissions: 'view',
				pub: pub,
				member: otherCommunityAdmin,
			}),
		)
		.expect(403);
});

it('allows a Pub admin to remove members with lower permissions in the same scope', async () => {
	const { pub, pubAdmin, youCannotPromoteMeToAdmin } = models;
	const agent = await login(pubAdmin);
	await agent
		.delete('/api/members')
		.send(
			createMemberRequest({
				pub: pub,
				member: youCannotPromoteMeToAdmin,
			}),
		)
		.expect(200);
	const memberNow = await Member.findOne({ where: { id: youCannotPromoteMeToAdmin.id } });
	expect(memberNow).toBeNull();
});

it('allows a Collection manager to remove members with lower permissions in the same scope', async () => {
	const { pub, collection, iCanDemoteYou, iWillBeDeleted } = models;
	const agent = await login(iCanDemoteYou);
	await agent
		.delete('/api/members')
		.send(
			createMemberRequest({
				pub: pub,
				collection: collection,
				member: iWillBeDeleted,
			}),
		)
		.expect(200);
	const memberNow = await Member.findOne({ where: { id: iWillBeDeleted.id } });
	expect(memberNow).toBeNull();
});

it('prevents a Collection manager from removing admins in a Pub scope', async () => {
	const { pub, collection, iCanDemoteYou, pubAdminMember } = models;
	const agent = await login(iCanDemoteYou);
	await agent
		.delete('/api/members')
		.send(
			createMemberRequest({
				pub: pub,
				collection: collection,
				member: pubAdminMember,
			}),
		)
		.expect(403);
	const memberNow = await Member.findOne({ where: { id: pubAdminMember.id } });
	expect(memberNow.id).toEqual(pubAdminMember.id);
});

it('allows a member who is a manager to remove themselves', async () => {
	// This user demoted themselves to manager in a previous test
	const { disillusionedCommunityAdmin, disillusionedCommunityAdminMember } = models;
	const agent = await login(disillusionedCommunityAdmin);
	await agent
		.delete('/api/members')
		.send(
			createMemberRequest({
				member: disillusionedCommunityAdminMember,
			}),
		)
		.expect(200);
	const memberNow = await Member.findOne({
		where: { id: disillusionedCommunityAdminMember.id },
	});
	expect(memberNow).toBeNull();
});
