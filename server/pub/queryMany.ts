import { QueryTypes, Op } from 'sequelize';
import { QueryBuilder } from 'knex';

import * as types from 'types';
import { knex, sequelize, Pub } from 'server/models';
import { buildPubOptions, sanitizePub } from 'server/utils/queryHelpers';
import { InitialData, PubsQuery, PubGetOptions, SanitizedPubData } from 'types';

const defaultColumns = {
	pubId: 'Pubs.id',
	title: knex.raw('lower("Pubs"."title")'),
	creationDate: 'Pubs.createdAt',
	isReleased: knex.raw('array_remove(array_agg("Releases"."id"), null) != Array[]::uuid[]'),
	collectionIds: knex.raw('array_agg(distinct "CollectionPubs"."collectionId")'),
	publishDate: knex.raw('coalesce("Pubs"."customPublishedAt", min("Releases"."createdAt"))'),
	updatedDate: knex.raw('greatest("Pubs"."updatedAt", max("Drafts"."latestKeyAt"))'),
};

const createColumns = (query: PubsQuery) => {
	const { scopedCollectionId, term, ordering, relatedUserIds: queryRelatedUserIds } = query;
	const collectionRank = scopedCollectionId
		? knex.raw('(array_agg("scopedCollectionPub"."rank"))[1]')
		: knex.raw('(array_agg("CollectionPubs"."rank"))[1]');
	const authorNames =
		term &&
		knex.raw(
			'array_cat(array_agg("attributionUser"."fullName"), array_agg("PubAttributions"."name"))',
		);
	const hasReviews =
		typeof query.hasReviews === 'boolean' &&
		knex.raw('array_remove(array_agg("ReviewNews"."id"), null) != Array[]::uuid[]');
	const submittedDate =
		ordering?.field === 'submittedDate' &&
		knex.raw('(array_agg("Submissions"."submittedAt"))[1]');
	const relatedUserIds =
		!!queryRelatedUserIds &&
		knex.raw('array_cat(array_agg("Members"."userId"), array_agg("PubAttributions"."userId"))');
	return {
		...defaultColumns,
		collectionRank,
		...(authorNames && { authorNames }),
		...(hasReviews && { hasReviews }),
		...(submittedDate && { submittedDate }),
		...(relatedUserIds && { relatedUserIds }),
	};
};

const createInnerWhereClause = (query: PubsQuery) => {
	const { withinPubIds, excludePubIds, communityId } = query;
	return (builder: QueryBuilder) => {
		builder.where({ 'Pubs.communityId': communityId });
		if (excludePubIds) {
			builder.whereNot({ 'Pubs.id': knex.raw('some(?::uuid[])', [excludePubIds]) });
		}
		if (withinPubIds) {
			builder.where({ 'Pubs.id': knex.raw('some(?::uuid[])', [withinPubIds]) });
		}
	};
};

const createJoins = (query: PubsQuery) => {
	const { scopedCollectionId, term, hasReviews, submissionStatuses, ordering, relatedUserIds } =
		query;
	return (builder: QueryBuilder) => {
		if (scopedCollectionId) {
			builder.innerJoin(
				{ scopedCollectionPub: 'CollectionPubs' },
				{
					'scopedCollectionPub.pubId': 'Pubs.id',
					'scopedCollectionPub.collectionId': knex.raw('?', scopedCollectionId),
				},
			);
		}
		builder.leftOuterJoin('CollectionPubs', 'Pubs.id', 'CollectionPubs.pubId');
		builder.leftOuterJoin('Releases', 'Pubs.id', 'Releases.pubId');
		builder.leftOuterJoin('Drafts', 'Pubs.draftId', 'Drafts.id');
		if (typeof hasReviews === 'boolean') {
			builder.leftOuterJoin('ReviewNews', 'Pubs.id', 'ReviewNews.pubId');
		}
		if (submissionStatuses || ordering?.field === 'submittedDate') {
			const joinOnStatuses = submissionStatuses && {
				'Submissions.status': knex.raw('some(?::text[])', [submissionStatuses]),
			};
			builder.innerJoin('Submissions', {
				'Submissions.pubId': 'Pubs.id',
				...joinOnStatuses,
			});
		}
		if (term || relatedUserIds) {
			builder.leftOuterJoin('PubAttributions', 'Pubs.id', 'PubAttributions.pubId');
			builder.leftOuterJoin(
				{ attributionUser: 'Users' },
				'PubAttributions.userId',
				'attributionUser.id',
			);
		}
		if (relatedUserIds) {
			builder.leftOuterJoin('Members', 'Pubs.id', 'Members.pubId');
		}
	};
};

const createOuterWhereClause = (query: PubsQuery) => {
	const { isReleased, hasReviews, collectionIds, excludeCollectionIds, term, relatedUserIds } =
		query;
	return (builder: QueryBuilder) => {
		if (typeof isReleased === 'boolean') {
			builder.where({ isReleased });
		}
		if (typeof hasReviews === 'boolean') {
			builder.where({ hasReviews });
		}
		if (collectionIds) {
			builder.whereRaw('?::uuid[] && "collectionIds"', [collectionIds]);
		}
		if (excludeCollectionIds) {
			builder.whereRaw('NOT(?::uuid[] && "collectionIds")', [excludeCollectionIds]);
		}
		if (relatedUserIds) {
			builder.whereRaw('?::uuid[] && "relatedUserIds"', [relatedUserIds]);
		}
		if (term) {
			builder.whereRaw(
				'"title" ilike ? OR EXISTS (SELECT FROM unnest("authorNames") name WHERE name ilike ?)',
				[`%${term}%`, `%${term}%`],
			);
		}
	};
};

const createOrderLimitOffset = (query: PubsQuery) => {
	const { offset, limit, ordering } = query;
	return (builder: QueryBuilder) => {
		if (ordering) {
			const { field, direction } = ordering;
			const rawQueryString = [
				'??',
				field === 'title' && `collate "C"`,
				direction.toLowerCase() === 'asc' ? 'asc' : 'desc',
				'nulls last',
			]
				.filter((x) => x)
				.join(' ');
			builder.orderByRaw(rawQueryString, [field]);
		}
		if (typeof limit === 'number') {
			builder.limit(limit);
		}
		if (typeof offset === 'number') {
			builder.offset(offset);
		}
	};
};

const getPubIdsQuery = (query: PubsQuery) => {
	const columns = createColumns(query);
	const joins = createJoins(query);
	const orderLimitOffset = createOrderLimitOffset(query);
	const innerWhereClause = createInnerWhereClause(query);
	const outerWhereClause = createOuterWhereClause(query);
	return knex
		.select('pubId')
		.from(function (this: QueryBuilder) {
			const outer = this.from(function (this: QueryBuilder) {
				this.columns(columns)
					.select()
					.from('Pubs')
					.where(innerWhereClause)
					.modify(joins)
					.groupBy('Pubs.id')
					.as('inner');
			});
			outerWhereClause(outer);
			orderLimitOffset(outer);
			outer.as('outer');
		})
		.toSQL()
		.toNative();
};

const sortPubsByListOfIds = (pubs: any[], pubIds: string[]) => {
	return pubs.concat().sort((a, b) => pubIds.indexOf(a.id) - pubIds.indexOf(b.id));
};

export const queryPubIds = async (query: PubsQuery): Promise<string[]> => {
	const { limit, collectionIds, withinPubIds } = query;
	const mustBeEmpty =
		(collectionIds && !collectionIds.length) ||
		(withinPubIds && !withinPubIds.length) ||
		(typeof limit === 'number' && limit <= 0);
	if (mustBeEmpty) {
		return [];
	}
	const { sql, bindings } = getPubIdsQuery(query);
	const results = await sequelize.query(sql, {
		type: QueryTypes.SELECT,
		bind: bindings,
	});
	return results.map((r) => r.pubId);
};

export const getPubsById = <T extends types.Pub = types.Pub>(
	pubIds: string[],
	options: PubGetOptions = {},
) => {
	const pubsPromise: Promise<types.SequelizeModel<T>[]> = Pub.findAll({
		where: { id: { [Op.in]: pubIds } },
		...buildPubOptions({ ...options, getMembers: true, getDraft: true }),
	}).then((unsortedPubs) => sortPubsByListOfIds(unsortedPubs, pubIds));
	return {
		unsanitized: () => pubsPromise,
		sanitize: async (initialData: InitialData) => {
			const pubs = await pubsPromise;
			return pubs
				.map((pub) => sanitizePub(pub.toJSON(), initialData))
				.filter((pub): pub is SanitizedPubData => !!pub);
		},
	};
};

export const getManyPubs = async ({
	query,
	options = {},
}: {
	query: PubsQuery;
	options?: PubGetOptions;
}) => {
	const pubIds = await queryPubIds(query);
	return getPubsById(pubIds, options);
};
