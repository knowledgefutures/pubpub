import { Op } from 'sequelize';

import * as types from 'types';
import {
	ActivityAssociations,
	ActivityAssociationType,
	activityAssociationTypes,
	ActivityAssociationIds,
	ActivityItemsContext,
	WithId,
	IdIndex,
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
	Review,
	Thread,
	ThreadComment,
	User,
} from 'server/models';
import { indexById } from 'utils/arrays';

type PromiseRecord<T extends { [k: string]: any }> = {
	[K in keyof T]: Promise<T[K]>;
};

type Scope = { communityId: string } & ({ pubId: string } | { collectionId: string } | {});

type FetchActivityItemsOptions = {
	scope: Scope;
	limit?: number;
	offset?: number;
};

const createAssociationsArrays = (): Record<ActivityAssociationType, string[]> => {
	const associations = {};
	activityAssociationTypes.forEach((type) => {
		associations[type] = [] as string[];
	});
	return associations as Record<ActivityAssociationType, string[]>;
};

const getPubsWhereQueryForScope = async (scope: Scope) => {
	if ('pubId' in scope) {
		return { pubId: scope.pubId };
	}
	if ('collectionId' in scope) {
		const collectionPubs = await CollectionPub.findAll({
			where: { collectionId: scope.collectionId },
			attributes: ['pubId'],
		});
		return {
			pubId: {
				[Op.in]: collectionPubs.map((cp) => cp.pubId),
			},
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
			...(await getPubsWhereQueryForScope(scope)),
		},
		orderBy: [['createdAt', 'DESC']],
	});
	return models.map((model) => model.toJSON());
};

const getActivityItemAssociationIds = (items: types.ActivityItem[]): ActivityAssociationIds => {
	const associationIds = createAssociationsArrays();
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
	items.forEach((item) => {
		community.push(item.communityId);
		user.push(item.actorId);
		if (item.collectionId) {
			collection.push(item.collectionId);
		}
		if (item.pubId) {
			pub.push(item.pubId);
		}
		if (item.kind === 'collection-pub-created' || item.kind === 'collection-pub-removed') {
			collection.push(item.collectionId);
			collectionPub.push(item.payload.collectionPubId);
		} else if (item.kind === 'pub-discussion-comment-added') {
			discussion.push(item.payload.discussionId);
			thread.push(item.payload.threadId);
			threadComment.push(item.payload.threadComment.id);
		} else if (item.kind === 'pub-review-created' || item.kind === 'pub-review-updated') {
			review.push(item.payload.reviewId);
		} else if (item.kind === 'pub-review-comment-added') {
			review.push(item.payload.reviewId);
			thread.push(item.payload.threadId);
			threadComment.push(item.payload.threadComment.id);
		} else if (item.kind === 'pub-edge-created' || item.kind === 'pub-edge-removed') {
			pubEdge.push(item.payload.pubEdgeId);
			if ('externalPublication' in item.payload.target) {
				externalPublication.push(item.payload.target.externalPublication.id);
			}
		} else if (item.kind === 'pub-released') {
			release.push(item.payload.releaseId);
		}
	});
	return associationIds;
};

const fetchModels = async <T extends WithId>(Model: any, ids: string[]): Promise<IdIndex<T>> => {
	if (ids.length === 0) {
		return {};
	}
	const models = await Model.findAll({ where: { id: { [Op.in]: [...new Set(ids)] } } });
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
		review: fetchModels<types.Review>(Review, review),
		threadComment: fetchModels<types.ThreadComment>(ThreadComment, threadComment),
		thread: fetchModels<types.Thread>(Thread, thread),
		user: fetchModels<types.User>(User, user),
	});
};

export const fetchActivityItems = async (
	options: FetchActivityItemsOptions,
): Promise<ActivityItemsContext> => {
	const activityItems = await fetchActivityItemModels(options);
	const associationIds = getActivityItemAssociationIds(activityItems);
	const associations = await fetchAssociations(associationIds);
	return { activityItems, associations };
};
