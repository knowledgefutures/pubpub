import { Op } from 'sequelize';

import * as types from 'types';
import {
	ActivityAssociations,
	ActivityAssociationType,
	activityAssociationTypes,
	ActivityAssociationIds,
	ActivityItemsFetchResult,
	WithId,
	IdIndex,
	Scope,
} from 'types';
import {
	ActivityItem,
	Collection,
	CollectionPub,
	Community,
	Discussion,
	ExternalPublication,
	Pub,
	PubEdge,
	Release,
	ReviewNew,
	Thread,
	ThreadComment,
	User,
} from 'server/models';
import { indexById } from 'utils/arrays';

type PromiseRecord<T extends { [k: string]: any }> = {
	[K in keyof T]: Promise<T[K]>;
};

type FetchActivityItemsOptions = {
	scope: Scope;
	limit?: number;
	offset?: number;
};

const createAssociationsSets = (): Record<ActivityAssociationType, Set<string>> => {
	const associations = {};
	activityAssociationTypes.forEach((type) => {
		associations[type] = new Set() as Set<string>;
	});
	return associations as Record<ActivityAssociationType, Set<string>>;
};

const getWhereQueryForChildScopes = async (scope: Scope) => {
	if ('pubId' in scope) {
		return { pubId: scope.pubId };
	}
	if ('collectionId' in scope) {
		const collectionPubs = await CollectionPub.findAll({
			where: { collectionId: scope.collectionId },
			attributes: ['pubId'],
		});
		return {
			[Op.or]: [
				{ collectionId: scope.collectionId },
				{
					pubId: {
						[Op.in]: collectionPubs.map((cp) => cp.pubId),
					},
				},
			],
		};
	}
	return null;
};

const fetchActivityItemModels = async (
	options: FetchActivityItemsOptions,
): Promise<types.ActivityItem[]> => {
	const { scope, limit = 50, offset = 0 } = options;
	const models = await ActivityItem.findAll({
		limit,
		offset,
		where: {
			communityId: scope.communityId,
			...(await getWhereQueryForChildScopes(scope)),
		},
		order: [['timestamp', 'DESC']],
	});
	return models.map((model) => model.toJSON());
};

const getActivityItemAssociationIds = (
	items: types.ActivityItem[],
	scope: Scope,
): ActivityAssociationIds => {
	const associationIds = createAssociationsSets();
	const {
		collectionPub,
		collection,
		community,
		discussion,
		externalPublication,
		pubEdge,
		pub,
		release,
		review,
		threadComment,
		thread,
		user,
	} = associationIds;
	community.add(scope.communityId);
	if ('pubId' in scope) {
		pub.add(scope.pubId);
	}
	if ('collectionId' in scope) {
		collection.add(scope.collectionId);
	}
	items.forEach((item) => {
		community.add(item.communityId);
		if (item.actorId) {
			user.add(item.actorId);
		}
		if (item.collectionId) {
			collection.add(item.collectionId);
		}
		if (item.pubId) {
			pub.add(item.pubId);
		}
		if (item.kind === 'collection-pub-created' || item.kind === 'collection-pub-removed') {
			collection.add(item.collectionId);
			collectionPub.add(item.payload.collectionPubId);
		} else if (item.kind === 'pub-discussion-comment-added') {
			discussion.add(item.payload.discussionId);
			thread.add(item.payload.threadId);
			threadComment.add(item.payload.threadComment.id);
		} else if (item.kind === 'pub-review-updated') {
			review.add(item.payload.reviewId);
		} else if (item.kind === 'pub-review-created') {
			review.add(item.payload.reviewId);
			thread.add(item.payload.threadId);
			if (item.payload.threadComment) {
				threadComment.add(item.payload.threadComment.id);
				user.add(item.payload.threadComment.userId);
			}
		} else if (item.kind === 'pub-review-comment-added') {
			review.add(item.payload.reviewId);
			thread.add(item.payload.threadId);
			threadComment.add(item.payload.threadComment.id);
		} else if (item.kind === 'pub-edge-created' || item.kind === 'pub-edge-removed') {
			pubEdge.add(item.payload.pubEdgeId);
			if ('externalPublication' in item.payload.target) {
				externalPublication.add(item.payload.target.externalPublication.id);
			} else if ('pub' in item.payload.target) {
				pub.add(item.payload.target.pub.id);
			}
		} else if (item.kind === 'pub-released') {
			release.add(item.payload.releaseId);
		}
	});
	return associationIds;
};

const fetchModels = async <T extends WithId>(Model: any, ids: Set<string>): Promise<IdIndex<T>> => {
	if (ids.size === 0) {
		return {};
	}
	const models = await Model.findAll({ where: { id: { [Op.in]: Array.from(ids) } } });
	return indexById(models as T[]);
};

const awaitAssociations = async (
	promised: PromiseRecord<ActivityAssociations>,
): Promise<ActivityAssociations> => {
	const associations: Partial<ActivityAssociations> = {};
	const keyValuePairs = await Promise.all(
		Object.entries(promised).map(async ([key, promise]) => {
			const value = await promise;
			return [key, value] as const;
		}),
	);
	keyValuePairs.forEach(([key, value]) => {
		associations[key] = value;
	});
	return associations as ActivityAssociations;
};

const fetchAssociations = (
	associationIds: ActivityAssociationIds,
): Promise<ActivityAssociations> => {
	const {
		collectionPub,
		collection,
		community,
		discussion,
		externalPublication,
		pubEdge,
		pub,
		release,
		review,
		threadComment,
		thread,
		user,
	} = associationIds;
	return awaitAssociations({
		collectionPub: fetchModels<types.CollectionPub>(CollectionPub, collectionPub),
		collection: fetchModels<types.Collection>(Collection, collection),
		community: fetchModels<types.Community>(Community, community),
		discussion: fetchModels<types.Discussion>(Discussion, discussion),
		externalPublication: fetchModels<types.ExternalPublication>(
			ExternalPublication,
			externalPublication,
		),
		pubEdge: fetchModels<types.PubEdge>(PubEdge, pubEdge),
		pub: fetchModels<types.Pub>(Pub, pub),
		release: fetchModels<types.Release>(Release, release),
		review: fetchModels<types.Review>(ReviewNew, review),
		threadComment: fetchModels<types.ThreadComment>(ThreadComment, threadComment),
		thread: fetchModels<types.Thread>(Thread, thread),
		user: fetchModels<types.User>(User, user),
	});
};

export const fetchActivityItems = async (
	options: FetchActivityItemsOptions,
): Promise<ActivityItemsFetchResult> => {
	const activityItems = await fetchActivityItemModels(options);
	const associationIds = getActivityItemAssociationIds(activityItems, options.scope);
	const associations = await fetchAssociations(associationIds);
	return { activityItems, associations };
};
