import { Op } from 'sequelize';

import * as types from 'types';
import {
	ActivityAssociations,
	ActivityAssociationIds,
	ActivityItemsFetchResult,
	ActivityFilter,
	WithId,
	IdIndex,
	ScopeId,
} from 'types';
import {
	attributesPublicUser,
	ActivityItem,
	Collection,
	CollectionPub,
	Community,
	Discussion,
	ExternalPublication,
	Page,
	Pub,
	PubEdge,
	Release,
	ReviewNew,
	Submission,
	Thread,
	ThreadComment,
	User,
} from 'server/models';
import { indexById } from 'utils/arrays';
import { createActivityAssociationSets } from '../../utils/activity';

type PromiseRecord<T extends { [k: string]: any }> = {
	[K in keyof T]: Promise<T[K]>;
};

type FetchActivityItemsOptions = {
	since?: string;
	scope: ScopeId;
	filters?: ActivityFilter[];
	limit?: number;
	offset?: number;
};

type SequelizeFilter = Partial<Record<keyof types.ActivityItem, any>>;

const itemKindFilter = (itemKinds: types.ActivityItemKind[]) => {
	return {
		kind: { [Op.in]: itemKinds },
	};
};

const memberItemKindFilter = (subFilter: null | SequelizeFilter = null) => {
	return {
		...subFilter,
		...itemKindFilter(['member-created', 'member-updated', 'member-removed']),
	};
};

const filterDefinitions: Record<ActivityFilter, SequelizeFilter | SequelizeFilter[]> = {
	community: [
		itemKindFilter(['community-created', 'community-updated']),
		memberItemKindFilter({ pubId: null, collectionId: null }),
	],
	collection: {
		collectionId: { [Op.not]: null },
	},
	page: itemKindFilter(['page-created', 'page-updated', 'page-removed']),
	pub: {
		pubId: { [Op.not]: null },
	},
	member: memberItemKindFilter(),
	review: itemKindFilter([
		'pub-review-created',
		'pub-review-updated',
		'pub-review-comment-added',
	]),
	discussion: itemKindFilter(['pub-discussion-comment-added']),
	pubEdge: itemKindFilter(['pub-edge-created', 'pub-edge-removed']),
	submission: itemKindFilter(['submission-status-updated']),
};

const getWhereQueryForChildScopes = async (scope: ScopeId) => {
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

const applyFiltersToWhereQuery = (whereQuery: any, filters: ActivityFilter[]) => {
	if (filters.length > 0) {
		const renderedFilters: SequelizeFilter[] = filters
			.map((filter) => filterDefinitions[filter])
			.reduce((acc: SequelizeFilter[], next: SequelizeFilter | SequelizeFilter[]) => {
				if (Array.isArray(next)) {
					return [...acc, ...next];
				}
				return [...acc, next];
			}, [] as SequelizeFilter[]);
		return {
			[Op.and]: [whereQuery, { [Op.or]: renderedFilters }],
		};
	}
	return whereQuery;
};

const fetchActivityItemModels = async (
	options: Required<FetchActivityItemsOptions>,
): Promise<types.ActivityItem[]> => {
	const { scope, limit, offset, since } = options;
	const whereQuery = {
		...(since && {
			timestamp: {
				[Op.gte]: since,
			},
		}),
		communityId: scope.communityId,
		...(await getWhereQueryForChildScopes(scope)),
	};
	const models = await ActivityItem.findAll({
		...(limit && { limit }),
		offset,
		where: applyFiltersToWhereQuery(whereQuery, options.filters),
		order: [['timestamp', 'DESC']],
	});
	return models.map((model) => model.toJSON());
};

const getActivityItemAssociationIds = (
	items: types.ActivityItem[],
	scope?: ScopeId,
): ActivityAssociationIds => {
	const associationIds = createActivityAssociationSets();
	const {
		collectionPub,
		collection,
		community,
		discussion,
		externalPublication,
		page,
		pubEdge,
		pub,
		release,
		review,
		submission,
		threadComment,
		thread,
		user,
	} = associationIds;
	if (scope) {
		community.add(scope.communityId);
		if ('pubId' in scope) {
			pub.add(scope.pubId);
		}
		if ('collectionId' in scope) {
			collection.add(scope.collectionId);
		}
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
			review.add(item.payload.review.id);
		} else if (item.kind === 'pub-review-created') {
			review.add(item.payload.review.id);
			thread.add(item.payload.threadId);
			if (item.payload.threadComment) {
				threadComment.add(item.payload.threadComment.id);
				if (item.payload.threadComment.userId) {
					user.add(item.payload.threadComment.userId);
				}
			}
		} else if (item.kind === 'pub-review-comment-added') {
			review.add(item.payload.review.id);
			thread.add(item.payload.threadId);
			threadComment.add(item.payload.threadComment.id);
		} else if (item.kind === 'pub-edge-created' || item.kind === 'pub-edge-removed') {
			pubEdge.add(item.payload.pubEdgeId);
			if ('externalPublication' in item.payload.target) {
				externalPublication.add(item.payload.target.externalPublication.id);
			} else if ('pub' in item.payload.target) {
				pub.add(item.payload.target.pub.id);
			}
		} else if (item.kind === 'pub-release-created') {
			release.add(item.payload.releaseId);
		} else if (
			item.kind === 'member-created' ||
			item.kind === 'member-updated' ||
			item.kind === 'member-removed'
		) {
			user.add(item.payload.userId);
		} else if (item.kind === 'submission-status-updated') {
			submission.add(item.payload.submissionId);
		} else if (
			item.kind === 'page-created' ||
			item.kind === 'page-updated' ||
			item.kind === 'page-removed'
		) {
			page.add(item.payload.page.id);
		}
	});
	return associationIds;
};

const fetchModels = async <T extends WithId>(
	Model: any,
	ids: Set<string>,
	attributes?: string[],
): Promise<IdIndex<T>> => {
	if (ids.size === 0) {
		return {};
	}
	const models = await Model.findAll({
		where: { id: { [Op.in]: Array.from(ids) } },
		...(attributes && { attributes }),
	});
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
		page,
		pubEdge,
		pub,
		release,
		review,
		submission,
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
		page: fetchModels<types.Page>(Page, page),
		pubEdge: fetchModels<types.PubEdge>(PubEdge, pubEdge),
		pub: fetchModels<types.Pub>(Pub, pub),
		release: fetchModels<types.Release>(Release, release),
		review: fetchModels<types.Review>(ReviewNew, review),
		submission: fetchModels<types.Submission>(Submission, submission),
		threadComment: fetchModels<types.ThreadComment>(ThreadComment, threadComment),
		thread: fetchModels<types.Thread>(Thread, thread),
		user: fetchModels<types.User>(User, user, attributesPublicUser),
	});
};

export const fetchAssociationsForActivityItems = async (
	activityItems: types.ActivityItem[],
	scope?: ScopeId,
) => {
	const associationIds = getActivityItemAssociationIds(activityItems, scope);
	return fetchAssociations(associationIds);
};

export const fetchActivityItems = async (
	options: FetchActivityItemsOptions,
): Promise<ActivityItemsFetchResult> => {
	const { offset = 0, limit = 0, scope, filters = [], since = '' } = options;
	const activityItems = await fetchActivityItemModels({ since, offset, limit, scope, filters });
	const associations = await fetchAssociationsForActivityItems(activityItems, options.scope);

	return { activityItems, associations, fetchedAllItems: activityItems.length < limit };
};
