import { Op } from 'sequelize';

import {
	AuthToken,
	CollectionAttribution,
	Community,
	CommunityBan,
	Discussion,
	EmailChangeToken,
	FeatureFlagUser,
	Hub,
	HubManager,
	Member,
	PubAttribution,
	Release,
	ReviewEvent,
	ReviewNew,
	ThreadComment,
	ThreadEvent,
	User,
	UserDismissable,
	UserNotification,
	UserNotificationPreferences,
	UserScopeVisit,
	UserSubscription,
	ZoteroIntegration,
} from 'server/models';
import { sequelize } from 'server/sequelize';
import { DELETED_USER_ID } from 'server/utils/systemEntities';
import { expect } from 'utils/assert';

/**
 * Pre-flight audit: returns counts to show the user before confirming deletion.
 */
export const getUserDeletionAudit = async (userId: string) => {
	const user = expect(await User.findByPk(userId));

	const [pubAttributionCount, collectionAttributionCount, commentCount] = await Promise.all([
		PubAttribution.count({ where: { userId } }),
		CollectionAttribution.count({ where: { userId } }),
		ThreadComment.count({ where: { userId } }),
	]);

	// Find communities where this user is the only admin
	const adminMemberships = await Member.findAll({
		where: { userId, permissions: 'admin', communityId: { [Op.ne]: null } },
		attributes: ['communityId'],
	});

	const otherAdminCounts = await Promise.all(
		adminMemberships.map((m) =>
			Member.count({
				where: {
					communityId: m.communityId,
					permissions: 'admin',
					userId: { [Op.ne]: userId },
				},
			}).then((count) => ({ communityId: m.communityId!, count })),
		),
	);

	const soleAdminCommunityIds = otherAdminCounts
		.filter((r) => r.count === 0)
		.map((r) => r.communityId);

	const soleAdminCommunities =
		soleAdminCommunityIds.length > 0
			? (
					await Community.findAll({
						where: { id: soleAdminCommunityIds },
						attributes: ['id', 'title', 'subdomain'],
					})
				).map((c) => ({ id: c.id, title: c.title, subdomain: c.subdomain }))
			: [];

	// Find hubs where this user is the only manager
	const hubManagerships = await HubManager.findAll({
		where: { userId },
		attributes: ['hubId'],
	});

	const otherManagerCounts = await Promise.all(
		hubManagerships.map((hm) =>
			HubManager.count({
				where: { hubId: (hm as any).hubId, userId: { [Op.ne]: userId } },
			}).then((count) => ({ hubId: (hm as any).hubId, count })),
		),
	);

	const soleManagerHubIds = otherManagerCounts.filter((r) => r.count === 0).map((r) => r.hubId);

	const soleManagerHubs =
		soleManagerHubIds.length > 0
			? (
					await Hub.findAll({
						where: { id: soleManagerHubIds },
						attributes: ['id', 'title', 'slug'],
					})
				).map((h) => ({ id: h.id, title: (h as any).title, slug: (h as any).slug }))
			: [];

	return {
		userId,
		fullName: user.fullName,
		email: user.email,
		pubAttributionCount,
		collectionAttributionCount,
		commentCount,
		soleAdminCommunities,
		soleManagerHubs,
	};
};

/**
 * Destroys a user account while preserving the scholarly record.
 *
 * The operation:
 * 1. Decouples PubAttributions & CollectionAttributions — copies the user's
 *    name/avatar/orcid into the standalone fields, then sets userId = NULL.
 *    This preserves authorship credit on all pubs regardless of DOI/release status.
 * 2. Reassigns discussions, comments, reviews, thread events, review events,
 *    releases, and community ban actor references to the sentinel deleted-user
 *    account. This keeps userId columns NOT NULL and lets the frontend render
 *    "Deleted User" by simply joining on the sentinel's name — no NULL detection
 *    needed.
 * 3. Explicitly deletes user-owned data with no scholarly value.
 * 4. Lets CASCADE handle the rest (Member, AuthToken, etc.).
 * 5. Destroys the User row.
 *
 * Runs inside a transaction so it's all-or-nothing.
 */
export const destroyUser = async (userId: string) => {
	if (userId === DELETED_USER_ID) {
		throw new Error('Cannot delete the system sentinel user');
	}

	const user = expect(await User.findByPk(userId));

	await sequelize.transaction(async (transaction) => {
		// ---------------------------------------------------------------
		// 1. Decouple attributions (preserve scholarly record)
		//    Copy user identity into the standalone fields, then unlink.
		// ---------------------------------------------------------------
		// For PubAttributions: set name/avatar/orcid from User, then null userId
		await sequelize.query(
			`UPDATE "PubAttributions"
			 SET "name"    = COALESCE("PubAttributions"."name", :fullName),
			     "avatar"  = COALESCE("PubAttributions"."avatar", :avatar),
			     "orcid"   = COALESCE("PubAttributions"."orcid", :orcid),
			     "userId"  = NULL
			 WHERE "userId" = :userId`,
			{
				replacements: {
					fullName: user.fullName,
					avatar: user.avatar,
					orcid: user.orcid,
					userId,
				},
				transaction,
			},
		);

		// For CollectionAttributions: same approach
		await sequelize.query(
			`UPDATE "CollectionAttributions"
			 SET "name"    = COALESCE("CollectionAttributions"."name", :fullName),
			     "avatar"  = COALESCE("CollectionAttributions"."avatar", :avatar),
			     "orcid"   = COALESCE("CollectionAttributions"."orcid", :orcid),
			     "userId"  = NULL
			 WHERE "userId" = :userId`,
			{
				replacements: {
					fullName: user.fullName,
					avatar: user.avatar,
					orcid: user.orcid,
					userId,
				},
				transaction,
			},
		);

		// ---------------------------------------------------------------
		// 2. Reassign all other userId / actorId FKs to sentinel
		//    This keeps columns NOT NULL-safe and lets the frontend
		//    show "Deleted User" via a normal User join.
		// ---------------------------------------------------------------
		await Discussion.update({ userId: DELETED_USER_ID }, { where: { userId }, transaction });

		await ThreadComment.update({ userId: DELETED_USER_ID }, { where: { userId }, transaction });

		await ReviewNew.update({ userId: DELETED_USER_ID }, { where: { userId }, transaction });

		await ThreadEvent.update({ userId: DELETED_USER_ID }, { where: { userId }, transaction });

		await ReviewEvent.update({ userId: DELETED_USER_ID }, { where: { userId }, transaction });

		await Release.update({ userId: DELETED_USER_ID }, { where: { userId }, transaction });

		await CommunityBan.update(
			{ actorId: DELETED_USER_ID },
			{ where: { actorId: userId }, transaction },
		);

		// ---------------------------------------------------------------
		// 3. Explicitly delete user-owned data without scholarly value
		//    (these lack proper CASCADE or have no FK associations)
		// ---------------------------------------------------------------
		await Promise.all([
			ZoteroIntegration.destroy({ where: { userId }, transaction }),
			// VisibilityUser is a join table — clean up directly
			sequelize.query(`DELETE FROM "VisibilityUsers" WHERE "userId" = :userId`, {
				replacements: { userId },
				transaction,
			}),
			UserScopeVisit.destroy({ where: { userId }, transaction }),
			UserDismissable.destroy({ where: { userId }, transaction }),
		]);

		// ---------------------------------------------------------------
		// 4. Let CASCADE handle: Member, AuthToken, EmailChangeToken,
		//    UserNotification, UserSubscription, UserNotificationPreferences,
		//    FeatureFlagUser, CommunityBan (userId side), HubManager
		// ---------------------------------------------------------------

		// ActivityItem.actorId has no FK — leave orphaned.
		// The UI should render missing actor lookups as "[Deleted User]".

		// ---------------------------------------------------------------
		// 5. Destroy the User row
		// ---------------------------------------------------------------
		await user.destroy({ transaction } as any);
	});

	console.log(`[destroyUser] User deleted: id=${userId} name=${user.fullName}`);

	return true;
};
