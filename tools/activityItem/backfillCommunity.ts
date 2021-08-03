import * as types from 'types';
import {
	ActivityItem,
	Collection,
	CollectionPub,
	Member,
	ThreadComment,
	Page,
	Pub,
	ReviewNew,
	Discussion,
	Release,
	PubEdge,
	PubAttribution,
} from 'server/models';
import {
	createCollectionActivityItem,
	createCollectionPubActivityItem,
	createCommunityCreatedActivityItem,
	createMemberCreatedActivityItem,
	createPageActivityItem,
	createPubActivityItem,
	createPubEdgeActivityItem,
	createPubReleasedActivityItem,
	createPubReviewCreatedActivityItem,
	createPubReviewCommentAddedActivityItem,
	createPubDiscussionCommentAddedActivityItem,
} from 'server/activityItem/queries';

import { forEach } from '../migrations/util';

type MembershipScope = { communityId: string } | { collectionId: string } | { pubId: string };

type Context = {
	community: types.Community;
	defaultActorId: string;
};

const deleteExistingItemsForCommunity = async (ctx: Context) => {
	const { community } = ctx;
	await ActivityItem.destroy({ where: { communityId: community.id } });
};

const setItemTimestamp = async (item: any, timestamp: string) => {
	item.timestamp = timestamp;
	await item.save();
};

const backfillMembers = async (ctx: Context, scope: MembershipScope) => {
	const members = await Member.findAll({ where: { ...scope } });
	await forEach(members, async (member) => {
		const item = await createMemberCreatedActivityItem(ctx.defaultActorId, member.id);
		await setItemTimestamp(item, member.createdAt);
	});
};

const backfillPages = async (ctx: Context) => {
	const pages = await Page.findAll({ where: { communityId: ctx.community.id } });
	await forEach(pages, async (page) => {
		const item = await createPageActivityItem('page-created', ctx.defaultActorId, page.id);
		await setItemTimestamp(item, page.createdAt);
	});
};

const backfillCommunity = async (ctx: Context) => {
	const { defaultActorId, community } = ctx;
	const item = await createCommunityCreatedActivityItem(defaultActorId, community.id);
	await setItemTimestamp(item, community.createdAt);
	await backfillMembers(ctx, { communityId: ctx.community.id });
	await backfillPages(ctx);
};

const backfillCollectionPubs = async (ctx: Context, collection: types.Collection) => {
	const collectionPubs = await CollectionPub.findAll({ where: { collectionId: collection.id } });
	await forEach(collectionPubs, async (collectionPub) => {
		const item = await createCollectionPubActivityItem(
			'collection-pub-created',
			ctx.defaultActorId,
			collectionPub.id,
		);
		await setItemTimestamp(item, collectionPub.createdAt);
	});
};

const backfillCollections = async (ctx: Context) => {
	const collections = await Collection.findAll({ where: { communityId: ctx.community.id } });
	await forEach(collections, async (collection) => {
		const item = await createCollectionActivityItem(
			'collection-created',
			ctx.defaultActorId,
			collection.id,
		);
		await setItemTimestamp(item, collection.createdAt);
		await backfillCollectionPubs(ctx, collection);
		await backfillMembers(ctx, { collectionId: collection.id });
	});
};

const backfillReview = async (review: types.Review) => {
	const threadComments = await ThreadComment.findAll({ where: { threadId: review.threadId } });
	const createdItem = await createPubReviewCreatedActivityItem(review.id);
	await setItemTimestamp(createdItem, review.createdAt);
	await forEach(threadComments, async (threadComment) => {
		const item = await createPubReviewCommentAddedActivityItem(review.id, threadComment.id);
		await setItemTimestamp(item, threadComment.createdAt);
	});
};

const backfillDiscussion = async (discussion: types.Discussion) => {
	const threadComments = await ThreadComment.findAll({
		where: { threadId: discussion.threadId },
	});
	await forEach(threadComments, async (threadComment, index) => {
		const item = await createPubDiscussionCommentAddedActivityItem(
			discussion.id,
			threadComment.id,
			index > 0,
		);
		await setItemTimestamp(item, threadComment.createdAt);
	});
};

const backfillPub = async (ctx: Context, pub: types.Pub) => {
	const [releases, reviews, discussions, pubEdges] = await Promise.all(
		[Release, ReviewNew, Discussion, PubEdge, PubAttribution].map((Model) =>
			Model.findAll({ where: { pubId: pub.id } }),
		),
	);
	const createdItem = await createPubActivityItem('pub-created', ctx.defaultActorId, pub.id);
	await setItemTimestamp(createdItem, pub.createdAt);
	await backfillMembers(ctx, { pubId: pub.id });

	await forEach(releases, async (release) => {
		const item = await createPubReleasedActivityItem(ctx.defaultActorId, release.id);
		await setItemTimestamp(item, release.createdAt);
	});

	await forEach(pubEdges, async (pubEdge) => {
		const item = await createPubEdgeActivityItem(
			'pub-edge-created',
			ctx.defaultActorId,
			pubEdge.id,
		);
		await setItemTimestamp(item, pubEdge.createdAt);
	});

	await forEach(reviews, (review) => backfillReview(review));
	await forEach(discussions, (discussion) => backfillDiscussion(discussion));
};

const backfillPubs = async (ctx: Context) => {
	const pubs = await Pub.findAll({ where: { communityId: ctx.community.id } });
	await forEach(pubs, (pub) => backfillPub(ctx, pub), 10);
};

export const backfillItemsForCommunity = async (community: types.Community) => {
	const ctx: Context = {
		community,
		// We won't always know who the actor is for the items the backfill creates, but we want
		// to slip this `null` past the assertions that actorId will be given in the future.
		defaultActorId: (null as unknown) as string,
	};
	await deleteExistingItemsForCommunity(ctx);
	await backfillCommunity(ctx);
	await backfillCollections(ctx);
	await backfillPubs(ctx);
};
