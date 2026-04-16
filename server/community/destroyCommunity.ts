import type { DoiUrlUpdate } from 'server/doi/updateUrls';

import { Op } from 'sequelize';

import { getCommunityDepositTarget } from 'server/depositTarget/queries';
import { updateDoiUrlsBestEffort } from 'server/doi/updateUrls';
import {
	ActivityItem,
	Collection,
	Community,
	CustomScript,
	Pub,
	PublicPermissions,
	Signup,
	SubmissionWorkflow,
	UserScopeVisit,
} from 'server/models';
import { sequelize } from 'server/sequelize';
import { ARCHIVE_COMMUNITY_ID } from 'server/utils/systemEntities';
import { expect } from 'utils/assert';

/**
 * Pre-flight audit: returns counts to show the user before confirming deletion.
 */
export const getCommunityDeletionAudit = async (communityId: string) => {
	const community = expect(await Community.findByPk(communityId));

	const [totalPubs, pubsWithDoi, pubsWithReleases] = await Promise.all([
		Pub.count({ where: { communityId } }),
		Pub.count({ where: { communityId, doi: { [Op.ne]: null } } }),
		Pub.count({
			where: { communityId },
			include: [{ association: 'releases', required: true }],
		}),
	]);

	return {
		communityId,
		communityTitle: community.title,
		communitySubdomain: community.subdomain,
		totalPubs,
		pubsWithDoi,
		pubsWithReleases,
		pubsWithoutDoi: totalPubs - pubsWithDoi,
	};
};

/**
 * Destroys a community and all its data.
 *
 * Pubs that have a DOI are moved to the archive community (archive.pubpub.org)
 * instead of being deleted, preserving the scholarly record and keeping DOI
 * URLs resolvable.
 *
 * Pubs without a DOI are hard-deleted along with all their dependent data
 * (discussions, attributions, releases, etc.) via Sequelize CASCADE.
 *
 * The operation runs inside a transaction so it's all-or-nothing.
 */
export const destroyCommunity = async (communityId: string, actorId: string) => {
	const community = expect(await Community.findByPk(communityId));

	if (communityId === ARCHIVE_COMMUNITY_ID) {
		throw new Error('Cannot delete the archive community');
	}

	// Read deposit target credentials BEFORE the transaction destroys them.
	// The DepositTarget row will be cascade-deleted with the community.
	const depositTarget = (await getCommunityDepositTarget(communityId, true)) ?? null;

	// We'll collect the DOI URL updates inside the transaction, then fire them
	// after the commit (external API calls shouldn't be inside a DB transaction).
	let doiUrlUpdates: DoiUrlUpdate[] = [];

	await sequelize.transaction(async (transaction) => {
		// ---------------------------------------------------------------
		// 1. Move DOI'd pubs to the archive community
		// ---------------------------------------------------------------
		const doiPubs = await Pub.findAll({
			where: { communityId, doi: { [Op.ne]: null } },
			attributes: ['id', 'doi', 'slug'],
			transaction,
		});

		if (doiPubs.length > 0) {
			const doiPubIds = doiPubs.map((p) => p.id);

			// Build the list of URL updates to submit after the transaction.
			doiUrlUpdates = doiPubs.map((p) => ({
				doi: p.doi!,
				newUrl: `https://archive.pubpub.org/pub/${p.slug}`,
			}));

			// Move pubs to archive community. All HasMany children (discussions,
			// attributions, releases, members, edges, etc.) follow via their
			// pubId FK -- no communityId column on those tables.
			await Pub.update(
				{ communityId: ARCHIVE_COMMUNITY_ID },
				{ where: { id: { [Op.in]: doiPubIds } }, transaction },
			);

			// Strip CollectionPub associations since the collections will be
			// deleted with the community.
			await sequelize.query(`DELETE FROM "CollectionPubs" WHERE "pubId" IN (:pubIds)`, {
				replacements: { pubIds: doiPubIds },
				transaction,
			});

			// Strip members from archived pubs -- permissions are meaningless
			// in the archive community.
			await sequelize.query(`DELETE FROM "Members" WHERE "pubId" IN (:pubIds)`, {
				replacements: { pubIds: doiPubIds },
				transaction,
			});
		}

		// ---------------------------------------------------------------
		// 2. Hard-delete non-DOI pubs and their orphan-prone children.
		//    Hooks are skipped (bulk destroy) because:
		//    a) The Pub.beforeDestroy activity hook creates an ActivityItem
		//       inside the CLS transaction, which conflicts with the
		//       subsequent DELETE of the same pub.
		//    b) We explicitly delete all ActivityItems in step 3 anyway.
		//
		//    Threads must be deleted explicitly because the FK direction
		//    is Discussion.threadId → Thread.id: deleting a Discussion
		//    does NOT cascade to its Thread. Deleting the Thread first
		//    cascades to ThreadComment, ThreadEvent, and Discussion.
		// ---------------------------------------------------------------
		const nonDoiPubFilter = `(SELECT "id" FROM "Pubs" WHERE "communityId" = :communityId AND "doi" IS NULL)`;
		await sequelize.query(
			`DELETE FROM "Threads" WHERE "id" IN (
				SELECT "threadId" FROM "Discussions" WHERE "pubId" IN ${nonDoiPubFilter}
				UNION
				SELECT "threadId" FROM "ReviewNews" WHERE "pubId" IN ${nonDoiPubFilter}
			)`,
			{ replacements: { communityId }, transaction },
		);

		await Pub.destroy({
			where: { communityId, doi: null },
			transaction,
		});

		// ---------------------------------------------------------------
		// 3. Clean up community-scoped data without FK cascades
		//    Several BelongsTo associations lack onDelete:'CASCADE' in
		//    their decorators, so the DB FK defaults to RESTRICT.
		//    We must destroy these explicitly before the community.
		// ---------------------------------------------------------------

		// SubmissionWorkflow → Collection has RESTRICT FK. Destroy first.
		const collections = await Collection.findAll({
			attributes: ['id'],
			where: { communityId },
			transaction,
		});
		const collectionIds = collections.map((collection) => collection.id);
		await SubmissionWorkflow.destroy({
			where: {
				collectionId: {
					[Op.in]: collectionIds,
				},
			},
			transaction,
		});

		// Collection → Community has RESTRICT FK. Destroy before community.
		await Collection.destroy({ where: { communityId }, transaction });

		await Promise.all([
			ActivityItem.destroy({ where: { communityId }, transaction }),
			UserScopeVisit.destroy({ where: { communityId }, transaction }),
			CustomScript.destroy({ where: { communityId }, transaction }),
			PublicPermissions.destroy({ where: { communityId }, transaction }),
			Signup.destroy({ where: { communityId }, transaction }),
		]);

		// ---------------------------------------------------------------
		// 4. Delete the community (CASCADE handles Pages, Members,
		//    DepositTargets, FeatureFlagCommunity, LandingPageFeatures,
		//    AuthTokens, CommunityBans)
		// ---------------------------------------------------------------
		await community.destroy({ transaction });
	});

	console.log(
		`[destroyCommunity] Community deleted: id=${communityId} subdomain=${community.subdomain} title=${community.title}`,
	);

	// ---------------------------------------------------------------
	// 5. Update DOI resolution URLs (best-effort, after commit)
	//    Uses URL-only updates so all other metadata at Crossref/DataCite
	//    (title, authors, collection/issue context, references, etc.)
	//    is preserved exactly as originally deposited.
	// ---------------------------------------------------------------
	if (doiUrlUpdates.length > 0) {
		const results = await updateDoiUrlsBestEffort(doiUrlUpdates, depositTarget);
		const failures = results.filter((r) => !r.success);
		if (failures.length > 0) {
			console.warn(
				`[destroyCommunity] ${failures.length}/${results.length} DOI URL updates failed. ` +
					`These DOIs will resolve to dead links until manually fixed: ` +
					failures.map((f) => f.doi).join(', '),
			);
		}
	}

	return true;
};
