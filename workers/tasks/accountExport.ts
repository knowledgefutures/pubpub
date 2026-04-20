import archiver from 'archiver';
import { PassThrough } from 'stream';

import {
	ActivityItem,
	AuthToken,
	Collection,
	CollectionAttribution,
	Community,
	Discussion,
	Member,
	Pub,
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
import { sendAccountExportReadyEmail } from 'server/utils/email';
import { exportsClient } from 'server/utils/s3';
import { updateWorkerTask } from 'server/workerTask/queries';
import { communityUrl, pubUrl } from 'utils/canonicalUrls';

const makePubUrl = (
	community: { subdomain: string; domain?: string | null } | null,
	pub: { slug: string } | null,
) => {
	if (!community || !pub) return null;
	return pubUrl(community as any, pub);
};

const makeCommunityUrl = (community: { subdomain: string; domain?: string | null } | null) => {
	if (!community) return null;
	return communityUrl(community as any);
};

/**
 * Fetches all data associated with a user account and packages it into a
 * downloadable .zip containing machine-readable JSON files.
 *
 * GDPR Article 20 compliant: structured, commonly used, machine-readable format.
 */
export const accountExportTask = async ({
	userId,
	key,
	workerTaskId,
}: {
	userId: string;
	key: string;
	workerTaskId?: string;
}) => {
	const user = await User.findByPk(userId);
	if (!user) {
		throw new Error(`User not found: ${userId}`);
	}

	// Build account.json — all PII fields, excluding security fields
	const accountData = {
		id: user.id,
		slug: user.slug,
		firstName: user.firstName,
		lastName: user.lastName,
		fullName: user.fullName,
		initials: user.initials,
		avatar: user.avatar,
		bio: user.bio,
		title: user.title,
		email: user.email,
		publicEmail: user.publicEmail,
		location: user.location,
		website: user.website,
		facebook: user.facebook,
		twitter: user.twitter,
		github: user.github,
		instagram: user.instagram,
		mastodon: user.mastodon,
		linkedin: user.linkedin,
		bluesky: user.bluesky,
		orcid: user.orcid,
		googleScholar: user.googleScholar,
		gdprConsent: user.gdprConsent,
		createdAt: user.createdAt,
		updatedAt: user.updatedAt,
	};

	// Query all associated data in parallel
	const [
		memberships,
		pubAttributions,
		collectionAttributions,
		discussions,
		comments,
		reviews,
		reviewEvents,
		threadEvents,
		releases,
		subscriptions,
		notifications,
		notificationPreferences,
		activity,
		scopeVisits,
		authTokens,
		zoteroIntegration,
		dismissables,
	] = await Promise.all([
		Member.findAll({
			where: { userId },
			include: [
				{
					model: Community,
					as: 'community',
					attributes: ['id', 'title', 'subdomain', 'domain'],
				},
				{ model: Pub, as: 'pub', attributes: ['id', 'title', 'slug'] },
			],
		}).then((rows) =>
			rows.map((r) => {
				const json = r.toJSON() as any;
				const community = json.community ?? null;
				const pub = json.pub ?? null;
				return {
					id: json.id,
					permissions: json.permissions,
					isOwner: json.isOwner,
					subscribedToActivityDigest: json.subscribedToActivityDigest,
					pubId: json.pubId,
					collectionId: json.collectionId,
					communityId: json.communityId,
					community,
					pub,
					communityUrl: makeCommunityUrl(community),
					pubUrl: makePubUrl(community, pub),
					createdAt: json.createdAt,
				};
			}),
		),

		PubAttribution.findAll({
			where: { userId },
			include: [
				{
					model: Pub,
					as: 'pub',
					attributes: ['id', 'title', 'slug', 'communityId'],
					include: [
						{
							model: Community,
							as: 'community',
							attributes: ['id', 'title', 'subdomain', 'domain'],
						},
					],
				},
			],
		}).then((rows) =>
			rows.map((r) => {
				const json = r.toJSON() as any;
				const pub = json.pub ?? null;
				const community = pub?.community ?? null;
				return {
					id: json.id,
					name: json.name,
					order: json.order,
					isAuthor: json.isAuthor,
					roles: json.roles,
					affiliation: json.affiliation,
					orcid: json.orcid,
					pubId: json.pubId,
					pub: pub ? { id: pub.id, title: pub.title, slug: pub.slug } : null,
					community,
					communityUrl: makeCommunityUrl(community),
					pubUrl: makePubUrl(community, pub),
					createdAt: json.createdAt,
				};
			}),
		),

		CollectionAttribution.findAll({
			where: { userId },
			include: [
				{
					model: Collection,
					as: 'collection',
					attributes: ['id', 'title', 'slug', 'communityId'],
					include: [
						{
							model: Community,
							as: 'community',
							attributes: ['id', 'title', 'subdomain', 'domain'],
						},
					],
				},
			],
		}).then((rows) =>
			rows.map((r) => {
				const json = r.toJSON() as any;
				const collection = json.collection ?? null;
				const community = collection?.community ?? null;
				return {
					id: json.id,
					name: json.name,
					order: json.order,
					isAuthor: json.isAuthor,
					roles: json.roles,
					affiliation: json.affiliation,
					orcid: json.orcid,
					collectionId: json.collectionId,
					collection: collection
						? { id: collection.id, title: collection.title, slug: collection.slug }
						: null,
					community,
					communityUrl: makeCommunityUrl(community),
					createdAt: json.createdAt,
				};
			}),
		),

		Discussion.findAll({
			where: { userId },
			attributes: ['id', 'title', 'number', 'isClosed', 'labels', 'pubId', 'createdAt'],
			include: [
				{
					model: Pub,
					as: 'pub',
					attributes: ['id', 'title', 'slug', 'communityId'],
					include: [
						{
							model: Community,
							as: 'community',
							attributes: ['id', 'title', 'subdomain', 'domain'],
						},
					],
				},
			],
		}).then((rows) =>
			rows.map((r) => {
				const json = r.toJSON() as any;
				const pub = json.pub ?? null;
				const community = pub?.community ?? null;
				return {
					id: json.id,
					title: json.title,
					number: json.number,
					isClosed: json.isClosed,
					labels: json.labels,
					pubId: json.pubId,
					pub: pub ? { id: pub.id, title: pub.title, slug: pub.slug } : null,
					community: community
						? {
								id: community.id,
								title: community.title,
								subdomain: community.subdomain,
							}
						: null,
					pubUrl: makePubUrl(community, pub),
					createdAt: json.createdAt,
				};
			}),
		),

		ThreadComment.findAll({
			where: { userId },
			attributes: ['id', 'text', 'content', 'threadId', 'createdAt'],
		}).then((rows) => rows.map((r) => r.toJSON())),

		ReviewNew.findAll({
			where: { userId },
			attributes: [
				'id',
				'title',
				'number',
				'status',
				'releaseRequested',
				'pubId',
				'reviewContent',
				'createdAt',
			],
			include: [
				{
					model: Pub,
					as: 'pub',
					attributes: ['id', 'title', 'slug', 'communityId'],
					include: [
						{
							model: Community,
							as: 'community',
							attributes: ['id', 'title', 'subdomain', 'domain'],
						},
					],
				},
			],
		}).then((rows) =>
			rows.map((r) => {
				const json = r.toJSON() as any;
				const pub = json.pub ?? null;
				const community = pub?.community ?? null;
				return {
					id: json.id,
					title: json.title,
					number: json.number,
					status: json.status,
					releaseRequested: json.releaseRequested,
					pubId: json.pubId,
					reviewContent: json.reviewContent,
					pub: pub ? { id: pub.id, title: pub.title, slug: pub.slug } : null,
					community: community
						? {
								id: community.id,
								title: community.title,
								subdomain: community.subdomain,
							}
						: null,
					pubUrl: makePubUrl(community, pub),
					createdAt: json.createdAt,
				};
			}),
		),

		ReviewEvent.findAll({
			where: { userId },
			attributes: ['id', 'type', 'data', 'reviewId', 'createdAt'],
		}).then((rows) => rows.map((r) => r.toJSON())),

		ThreadEvent.findAll({
			where: { userId },
			attributes: ['id', 'type', 'data', 'threadId', 'createdAt'],
		}).then((rows) => rows.map((r) => r.toJSON())),

		// Release has no BelongsTo Pub association, so we look up pub info separately
		Release.findAll({
			where: { userId },
			attributes: ['id', 'noteText', 'pubId', 'historyKey', 'createdAt'],
		}).then((rows) => rows.map((r) => r.toJSON())),

		UserSubscription.findAll({
			where: { userId },
		}).then((rows) => rows.map((r) => r.toJSON())),

		UserNotification.findAll({
			where: { userId },
		}).then((rows) => rows.map((r) => r.toJSON())),

		UserNotificationPreferences.findOne({
			where: { userId },
		}).then((r) => r?.toJSON() ?? null),

		ActivityItem.findAll({
			where: { actorId: userId },
			attributes: ['id', 'kind', 'pubId', 'communityId', 'payload', 'createdAt'],
		}).then((rows) => rows.map((r) => r.toJSON())),

		UserScopeVisit.findAll({
			where: { userId },
		}).then((rows) => rows.map((r) => r.toJSON())),

		// Include auth token metadata but redact the actual token values
		AuthToken.findAll({
			where: { userId },
			attributes: ['id', 'communityId', 'expiresAt', 'createdAt'],
			include: [
				{
					model: Community,
					as: 'community',
					attributes: ['id', 'title', 'subdomain', 'domain'],
				},
			],
		}).then((rows) =>
			rows.map((r) => {
				const json = r.toJSON() as any;
				const community = json.community ?? null;
				return {
					id: json.id,
					communityId: json.communityId,
					community,
					communityUrl: makeCommunityUrl(community),
					expiresAt: json.expiresAt,
					createdAt: json.createdAt,
				};
			}),
		),

		ZoteroIntegration.findOne({
			where: { userId },
			attributes: ['id', 'userId', 'createdAt'],
		}).then((r) => (r ? { id: r.id, userId: r.userId, createdAt: r.createdAt } : null)),

		UserDismissable.findAll({
			where: { userId },
		}).then((rows) => rows.map((r) => r.toJSON())),
	]);

	// Build the zip archive
	const archive = archiver('zip', { zlib: { level: 9 } });
	const passThrough = new PassThrough();
	archive.pipe(passThrough);

	const addJson = (name: string, data: unknown) => {
		archive.append(JSON.stringify(data, null, 2), { name });
	};

	addJson('account.json', accountData);
	addJson('memberships.json', memberships);
	addJson('pub-attributions.json', pubAttributions);
	addJson('collection-attributions.json', collectionAttributions);
	addJson('discussions.json', discussions);
	addJson('comments.json', comments);
	addJson('reviews.json', reviews);
	addJson('review-events.json', reviewEvents);
	addJson('thread-events.json', threadEvents);
	addJson('releases.json', releases);
	addJson('subscriptions.json', subscriptions);
	addJson('notifications.json', notifications);
	addJson('notification-preferences.json', notificationPreferences);
	addJson('activity.json', activity);
	addJson('scope-visits.json', scopeVisits);
	addJson('auth-tokens.json', authTokens);
	addJson('zotero-integration.json', zoteroIntegration);
	addJson('dismissables.json', dismissables);

	archive.finalize();

	// Upload to S3 (private — no public-read ACL)
	const s3Key = `${key}.zip`;
	await exportsClient.uploadFileSplit(s3Key, passThrough, {
		queueSize: 10,
	});

	// Generate a presigned URL (7-day expiry, rewritten to assets.pubpub.org)
	const downloadUrl = await exportsClient.getPresignedUrl(s3Key);

	if (workerTaskId) {
		await updateWorkerTask({
			id: workerTaskId,
			body: { output: downloadUrl },
		});
	}

	// Send email notification
	try {
		await sendAccountExportReadyEmail({
			toEmail: user.email,
			downloadUrl,
		});
	} catch (emailError) {
		console.error(
			`[accountExport] Failed to send export-ready email to ${user.email}:`,
			emailError,
		);
	}

	console.log(`[accountExport] Export complete for user ${userId}`);

	return downloadUrl;
};
