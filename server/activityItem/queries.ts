import * as types from 'types';
import {
	Collection,
	CollectionPub,
	Community,
	Discussion,
	ExternalPublication,
	Member,
	Page,
	Pub,
	PubEdge,
	Release,
	ReviewNew,
	Thread,
	ThreadComment,
} from 'server/models';

import { getDiffsForPayload, getChangeFlagsForPayload, createActivityItem } from './utils';

const resolvePartialMemberItem = async (member: types.Member) => {
	if (member.pubId) {
		const pub: types.Pub = await Pub.findOne({ where: { id: member.pubId } });
		return {
			tag: 'pub',
			value: {
				communityId: pub.communityId,
				pubId: pub.id,
				payload: {
					pub: {
						title: pub.title,
					},
				},
			},
		} as const;
	}
	if (member.collectionId) {
		const collection: types.Collection = await Collection.findOne({
			where: { id: member.collectionId },
		});
		return {
			tag: 'collection',
			value: {
				communityId: collection.communityId,
				collectionId: collection.id,
				payload: {
					collection: {
						title: collection.title,
					},
				},
			},
		} as const;
	}
	if (member.communityId) {
		const community: types.Community = await Community.findOne({
			where: { id: member.communityId },
		});
		return {
			tag: 'community',
			value: {
				communityId: community.id,
				payload: {
					community: {
						title: community.title,
					},
				},
			},
		} as const;
	}
	throw new Error('Invalid Member');
};

const buildMemberActivityItemParams = <
	SharedItem extends Record<string, any>,
	Rest extends { communityId: string },
	Payload extends Record<string, any>
>(
	item: SharedItem,
	value: Rest & { payload: Payload },
) => {
	const { payload, ...rest } = value;
	return {
		...item,
		...rest,
		payload: { ...item.payload, ...payload },
	};
};

export const createCommunityCreatedActivityItem = async (
	actorId: null | string,
	communityId: string,
) => {
	const community: types.Community = await Community.findOne({ where: { id: communityId } });
	return createActivityItem({
		actorId,
		kind: 'community-created' as const,
		communityId,
		payload: {
			community: {
				title: community.title,
			},
		},
	});
};

export const createCommunityUpdatedActivityItem = async (
	actorId: null | string,
	communityId: string,
	oldCommunity: types.Community,
) => {
	const community: types.Community = await Community.findOne({ where: { id: communityId } });
	const diffs = getDiffsForPayload(community, oldCommunity, ['title']);
	return createActivityItem({
		actorId,
		kind: 'community-updated' as const,
		communityId,
		payload: {
			...diffs,
			community: {
				title: community.title,
			},
		},
	});
};

export const createMemberCreatedActivityItem = async (actorId: null | string, memberId: string) => {
	const member = await Member.findOne({ where: { id: memberId } });
	const partial = await resolvePartialMemberItem(member);
	const item = {
		kind: 'member-created' as const,
		actorId,
		payload: {
			userId: member.userId,
			permissions: member.permissions,
		},
	};
	// We're doing this hand-holding to remind TypeScript that the 'payload' and 'rest' parts
	// of the discriminated union of partial.value must go together -- if you see a pubId in 'rest'
	// then we can infer that 'payload' must have {pub: {title: string}} -- and we need TypeScript
	// to understand this as well.
	if (partial.tag === 'pub') {
		return createActivityItem(buildMemberActivityItemParams(item, partial.value));
	}
	if (partial.tag === 'collection') {
		return createActivityItem(buildMemberActivityItemParams(item, partial.value));
	}
	if (partial.tag === 'community') {
		return createActivityItem(buildMemberActivityItemParams(item, partial.value));
	}
	throw new Error('Invalid Scope');
};

export const createMemberRemovedActivityItem = async (actorId: null | string, memberId: string) => {
	const member = await Member.findOne({ where: { id: memberId } });
	const partial = await resolvePartialMemberItem(member);
	const item = {
		kind: 'member-removed' as const,
		actorId,
		payload: {
			userId: member.userId,
		},
	};
	if (partial.tag === 'pub') {
		return createActivityItem(buildMemberActivityItemParams(item, partial.value));
	}
	if (partial.tag === 'collection') {
		return createActivityItem(buildMemberActivityItemParams(item, partial.value));
	}
	if (partial.tag === 'community') {
		return createActivityItem(buildMemberActivityItemParams(item, partial.value));
	}
	throw new Error('Invalid Scope');
};

export const createMemberUpdatedActivityItem = async (
	actorId: null | string,
	memberId: string,
	oldMember: types.Member,
) => {
	const member: types.Member = await Member.findOne({ where: { id: memberId } });
	const partial = await resolvePartialMemberItem(member);
	const diffs = getDiffsForPayload(member, oldMember, ['permissions']);
	const item = {
		kind: 'member-updated' as const,
		actorId,
		payload: {
			userId: member.userId,
			...diffs,
		},
	};
	if (partial.tag === 'pub') {
		return createActivityItem(buildMemberActivityItemParams(item, partial.value));
	}
	if (partial.tag === 'collection') {
		return createActivityItem(buildMemberActivityItemParams(item, partial.value));
	}
	if (partial.tag === 'community') {
		return createActivityItem(buildMemberActivityItemParams(item, partial.value));
	}
	throw new Error('Invalid Scope');
};

export const createCollectionActivityItem = async (
	kind: 'collection-created' | 'collection-removed',
	actorId: null | string,
	collectionId: string,
) => {
	const collection: types.Collection = await Collection.findOne({ where: { id: collectionId } });
	const { title } = collection;
	return createActivityItem({
		kind,
		collectionId,
		actorId,
		communityId: collection.communityId,
		payload: {
			collection: {
				title,
			},
		},
	});
};

export const createCollectionUpdatedActivityItem = async (
	actorId: null | string,
	collectionId: string,
	oldCollection: types.Collection,
) => {
	const collection: types.Collection = await Collection.findOne({ where: { id: collectionId } });
	const { title } = collection;
	const diffs = getDiffsForPayload(collection, oldCollection, [
		'isPublic',
		'isRestricted',
		'title',
		'slug',
	]);
	const flags = getChangeFlagsForPayload(collection, oldCollection, ['layout', 'metadata']);
	return createActivityItem({
		kind: 'collection-updated' as const,
		collectionId,
		actorId,
		communityId: collection.communityId,
		payload: {
			collection: {
				title,
			},
			...flags,
			...diffs,
		},
	});
};

export const createPageActivityItem = async (
	kind: 'page-created' | 'page-removed',
	actorId: null | string,
	pageId: string,
) => {
	const page: types.Page = await Page.findOne({ where: { id: pageId } });
	return createActivityItem({
		kind,
		actorId,
		communityId: page.communityId,
		payload: {
			page: {
				id: page.id,
				title: page.title,
			},
		},
	});
};

export const createPageUpdatedActivityItem = async (
	actorId: null | string,
	pageId: string,
	oldPage: types.Page,
) => {
	const page: types.Page = await Page.findOne({ where: { id: pageId } });
	const diffs = getDiffsForPayload(page, oldPage, ['isPublic', 'title', 'slug', 'description']);
	const flags = getChangeFlagsForPayload(page, oldPage, ['layout']);
	return createActivityItem({
		kind: 'page-updated' as const,
		actorId,
		communityId: page.communityId,
		payload: {
			page: {
				title: page.title,
				id: page.id,
			},
			...flags,
			...diffs,
		},
	});
};

export const createPubReviewCreatedActivityItem = async (reviewId: string) => {
	const review: types.DefinitelyHas<types.Review, 'thread'> = await ReviewNew.findOne({
		where: { id: reviewId },
		include: [
			{
				model: Thread,
				as: 'thread',
				include: [{ model: ThreadComment, as: 'comments', order: [['createdAt', 'ASC']] }],
			},
		],
	});
	const threadComment: types.ThreadComment = review.thread.comments[0];
	const pub: types.Pub = await Pub.findOne({ where: { id: review.pubId } });

	const payloadThreadComment = threadComment && {
		id: threadComment.id,
		text: threadComment.text,
		userId: threadComment.userId,
	};

	return createActivityItem({
		communityId: pub.communityId,
		actorId: review.userId,
		kind: 'pub-review-created',
		pubId: pub.id,
		payload: {
			reviewId,
			threadId: review.threadId,
			isReply: false,
			pub: { title: pub.title },
			...(payloadThreadComment && { threadComment: payloadThreadComment }),
		},
	});
};

export const createPubReviewCommentAddedActivityItem = async (
	reviewId: string,
	threadCommentId: string,
) => {
	const [review, threadComment]: [types.Review, types.ThreadComment] = await Promise.all([
		ReviewNew.findOne({
			where: { id: reviewId },
		}),
		ThreadComment.findOne({ where: { id: threadCommentId } }),
	]);
	const pub = await Pub.findOne({ where: { id: review.pubId } });
	return createActivityItem({
		communityId: pub.communityId,
		actorId: threadComment.userId,
		kind: 'pub-review-comment-added' as const,
		pubId: pub.id,
		payload: {
			reviewId,
			threadId: review.threadId,
			isReply: true,
			threadComment: {
				id: threadComment.id,
				text: threadComment.text,
				userId: threadComment.userId,
			},
			pub: { title: pub.title },
		},
	});
};

export const createPubReviewUpdatedActivityItem = async (
	actorId: null | string,
	reviewId: string,
	oldReview: types.Review,
) => {
	const review: types.Review = await ReviewNew.findOne({ where: { id: reviewId } });
	const pub: types.Pub = await Pub.findOne({ where: { id: review.pubId } });
	const diffs = getDiffsForPayload(review, oldReview, ['status']);
	return createActivityItem({
		kind: 'pub-review-updated',
		pubId: pub.id,
		actorId,
		communityId: pub.communityId,
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
	actorId: null | string,
	collectionPubId: string,
) => {
	const collectionPub: types.DefinitelyHas<
		types.CollectionPub,
		'pub' | 'collection'
	> = await CollectionPub.findOne({
		where: { id: collectionPubId },
		include: [
			{ model: Pub, as: 'pub' },
			{ model: Collection, as: 'collection' },
		],
	});
	return createActivityItem({
		kind,
		pubId: collectionPub.pubId,
		collectionId: collectionPub.collectionId,
		actorId,
		communityId: collectionPub.collection.communityId,
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
	kind: 'pub-created' | 'pub-removed',
	actorId: null | string,
	pubId: string,
) => {
	const pub: types.Pub = await Pub.findOne({ where: { id: pubId } });
	return createActivityItem({
		kind,
		actorId,
		communityId: pub.communityId,
		pubId: pub.id,
		payload: {
			pub: {
				title: pub.title,
			},
		},
	});
};

export const createPubUpdatedActivityItem = async (
	actorId: null | string,
	pubId: string,
	oldPub: types.Pub,
) => {
	const pub: types.Pub = await Pub.findOne({ where: { id: pubId } });
	const diffs = getDiffsForPayload(pub, oldPub, ['title', 'doi']);
	return createActivityItem({
		kind: 'pub-updated' as const,
		actorId,
		communityId: pub.communityId,
		pubId: pub.id,
		payload: {
			...diffs,
			pub: {
				title: pub.title,
			},
		},
	});
};

export const createPubReleasedActivityItem = async (actorId: null | string, releaseId: string) => {
	const release: types.Release = await Release.findOne({ where: { id: releaseId } });
	const pub: types.Pub = await Pub.findOne({ where: { id: release.pubId } });
	return createActivityItem({
		kind: 'pub-release-created' as const,
		actorId,
		communityId: pub.communityId,
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
	actorId: null | string,
	pubEdgeId: string,
) => {
	const pubEdge: types.DefinitelyHas<types.PubEdge, 'pub'> &
		types.DefinitelyHas<
			types.PubEdge,
			'targetPub' | 'externalPublication'
		> = await PubEdge.findOne({
		where: { id: pubEdgeId },
		include: [
			{ model: Pub, as: 'pub' },
			{ model: Pub, as: 'targetPub' },
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
					id: pubEdge.targetPub.id,
					title: pubEdge.targetPub.title,
					slug: pubEdge.targetPub.slug,
				},
		  };
	return createActivityItem({
		kind,
		actorId,
		communityId: pubEdge.pub.communityId,
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

export const createPubDiscussionCommentAddedActivityItem = async (
	discussionId: string,
	threadCommentId: string,
	isReply: boolean,
) => {
	const [threadComment, discussion]: [types.ThreadComment, types.Discussion] = await Promise.all([
		ThreadComment.findOne({
			where: { id: threadCommentId },
		}),
		Discussion.findOne({
			where: { id: discussionId },
		}),
	]);
	const pub: types.Pub = await Pub.findOne({ where: { id: discussion.pubId } });
	return createActivityItem({
		kind: 'pub-discussion-comment-added',
		pubId: discussion.pubId,
		actorId: threadComment.userId,
		communityId: pub.communityId,
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
				userId: threadComment.userId,
			},
		},
	});
};
