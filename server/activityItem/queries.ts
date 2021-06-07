import * as types from 'types';

import {
	Collection,
	Member,
	Community,
	PubEdge,
	Discussion,
	ExternalPublication,
	ReviewNew,
	Pub,
	CollectionPub,
	ThreadComment,
	Thread,
} from 'server/models';

import { getDiffsForPayload, getChangeFlagsForPayload, createActivityItem } from './utils';

export const createCommunityActivityItem = async (
	kind: 'community-created' | 'community-updated',
	actorId: string,
	oldCommunity: types.Community,
	communityId: string,
) => {
	const community: types.Community = await Community.findOne({ where: { id: communityId } });
	const diffs = getDiffsForPayload(community, oldCommunity, ['title']);
	return createActivityItem({
		actorId,
		kind,
		communityId,
		payload: {
			...diffs,
			community: {
				title: community.title,
			},
		},
	});
};

export const createMemberUpdatedActivityItem = async (
	kind: 'member-updated',
	actorId: string,
	communityId: string,
	memberId: string,
	oldMember: types.Member,
) => {
	const member: types.Member = await Member.findOne({ where: { id: memberId } });
	const diffs = getDiffsForPayload(member, oldMember, ['permissions']);
	return createActivityItem({
		kind,
		actorId,
		communityId,
		payload: {
			userId: member.userId,
			...diffs,
		},
	});
};

export const createMemberActivityItem = async (
	kind: 'member-created' | 'member-removed',
	actorId: string,
	communityId: string,
	memberId: string,
) => {
	const member: types.Member = await Member.findOne({ where: { id: memberId } });
	return createActivityItem({
		kind,
		actorId,
		communityId,
		payload: {
			userId: member.userId,
			permissions: member.permissions,
		},
	});
};

export const createCollectionActivityItem = async (
	kind: 'collection-created' | 'collection-updated' | 'collection-removed',
	collectionId: string,
	actorId: string,
	communityId: string,
	oldCollection: types.Collection,
) => {
	const collection: types.Collection = await Collection.findOne({ where: { id: collectionId } });
	const { title } = collection;
	const diffs = getDiffsForPayload(collection, oldCollection, [
		'isPublic',
		'isRestricted',
		'title',
	]);
	const flags = getChangeFlagsForPayload(collection, oldCollection, ['layout', 'metadata']);
	return createActivityItem({
		kind,
		collectionId,
		actorId,
		communityId,
		payload: {
			collection: {
				title,
			},
			...flags,
			...diffs,
		},
	});
};

export const createPubReviewCreatedActivityItem = async (
	kind: 'pub-review-created' | 'pub-review-comment-added',
	actorId: string,
	communityId: string,
	reviewId: string,
	isReply: boolean,
) => {
	const review: types.DefinitelyHas<types.Review, 'thread'> = await ReviewNew.findOne({
		where: { id: reviewId },
		includes: [
			{ model: Thread, as: 'thread', includes: [{ model: ThreadComment, as: 'comments' }] },
		],
	});
	const threadComment: types.ThreadComment = review.thread.comments[0];
	const pub: types.Pub = await Pub.findOne({ where: { id: review.pubId } });
	return createActivityItem({
		communityId,
		actorId,
		kind,
		pubId: pub.id,
		payload: {
			reviewId,
			threadId: review.threadId,
			isReply,
			threadComment: {
				id: threadComment.id,
				text: threadComment.text,
				userId: actorId,
			},
			pub: { title: pub.title },
		},
	});
};

export const createPubReviewUpdatedActivityItem = async (
	kind: 'pub-review-updated',
	actorId: string,
	communityId: string,
	reviewId: string,
	oldReview: types.Review,
) => {
	const review: types.Review = await ReviewNew.findOne({ where: { id: reviewId } });
	const pub: types.Pub = await Pub.findOne({ where: { id: review.pubId } });
	const diffs = getDiffsForPayload(review, oldReview, ['status']);
	return createActivityItem({
		kind,
		pubId: pub.id,
		actorId,
		communityId,
		payload: {
			...diffs,
			pub: {
				title: pub.title,
			},
			reviewId,
		},
	});
};

export const createCollectionPubActivityItem = async (
	kind: 'collection-pub-created' | 'collection-pub-removed',
	actorId: string,
	communityId: string,
	collectionPubId: string,
) => {
	const collectionPub: types.DefinitelyHas<
		types.CollectionPub,
		'pub' | 'collection'
	> = await CollectionPub.findOne({
		where: { id: collectionPubId },
		includes: [
			{ model: Pub, as: 'pub' },
			{ model: Collection, as: 'collection' },
		],
	});
	return createActivityItem({
		kind,
		pubId: collectionPub.pubId,
		collectionId: collectionPub.collectionId,
		actorId,
		communityId,
		payload: {
			collectionPubId,
			pub: {
				title: collectionPub.pub.title,
			},
			collection: {
				title: collectionPub.collection.title,
			},
		},
	});
};

export const createPubActivityItem = async (
	kind: 'pub-created' | 'pub-updated' | 'pub-removed',
	actorId: string,
	oldPub: types.Pub,
	communityId: string,
	pubId: string,
) => {
	const pub: types.Pub = await Pub.findOne({ where: { id: pubId } });
	const diffs = kind === 'pub-updated' && getDiffsForPayload(pub, oldPub, ['title', 'doi']);
	return createActivityItem({
		kind,
		actorId,
		communityId,
		pubId: pub.id,
		payload: {
			...diffs,
			pub: {
				title: pub.title,
			},
		},
	});
};

export const createPubReleaseActivityItem = async (
	kind: 'pub-released',
	actorId: string,
	communityId: string,
	releaseId: string,
	pubId: string,
) => {
	const pub: types.Pub = await Pub.findOne({ where: { id: pubId } });
	return createActivityItem({
		kind,
		actorId,
		communityId,
		pubId: pub.id,
		payload: {
			releaseId,
			pub: {
				title: pub.title,
			},
		},
	});
};

export const createPubEdgeActivityItem = async (
	kind: 'pub-edge-created' | 'pub-edge-removed',
	actorId: string,
	pubEdgeId: string,
	communityId: string,
) => {
	const pubEdge: types.DefinitelyHas<types.PubEdge, 'pub'> &
		types.DefinitelyHas<
			types.PubEdge,
			'targetPub' | 'externalPublication'
		> = await PubEdge.findOne({
		where: { id: pubEdgeId },
		includes: [
			{ model: Pub, as: 'pub' },
			{ model: ExternalPublication, as: 'externalPublication' },
		],
	});
	const isExternalEdge = !!pubEdge.externalPublicationId!!;
	const target = isExternalEdge
		? {
				externalPublication: {
					id: pubEdge.externalPublication.id,
					title: pubEdge.externalPublication.title,
					url: pubEdge.externalPublication.url,
				},
		  }
		: {
				pub: {
					id: pubEdge.pubId,
					title: pubEdge.pub.title,
					slug: pubEdge.pub.slug,
				},
		  };
	return createActivityItem({
		kind,
		actorId,
		communityId,
		pubId: pubEdge.pubId,
		payload: {
			pub: {
				title: pubEdge.pub.title,
			},
			pubEdgeId,
			target,
		},
	});
};

export const createPubDiscussionActivityItem = async (
	kind: 'pub-discussion-comment-added',
	actorId: string,
	communityId: string,
	isReply: boolean,
	pubId: string,
	discussionId: string,
	threadCommentId: string,
) => {
	const [pub, threadComment]: [types.Pub, types.ThreadComment] = await Promise.all([
		Pub.findOne({ where: { id: pubId } }),
		ThreadComment.findOne({ where: { id: threadCommentId } }),
	]);
	const discussion: types.DefinitelyHas<types.Discussion, 'thread'> = await Discussion.findOne({
		where: { id: discussionId },
	});
	return createActivityItem({
		kind,
		pubId,
		actorId,
		communityId,
		payload: {
			pub: {
				title: pub.title,
			},
			discussionId,
			threadId: discussion.threadId,
			isReply,
			threadComment: {
				id: threadCommentId,
				text: threadComment.text,
				userId: actorId,
			},
		},
	});
};
