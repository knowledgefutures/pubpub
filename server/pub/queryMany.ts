import { QueryTypes, Op } from 'sequelize';
import { QueryBuilder } from 'knex';

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
	const { scopedCollectionId, term } = query;
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
	return {
		...defaultColumns,
		collectionRank,
		...(authorNames && { authorNames }),
		...(hasReviews && { hasReviews }),
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
	const { scopedCollectionId, term, hasReviews } = query;
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
		if (term) {
			builder.leftOuterJoin('PubAttributions', 'Pubs.id', 'PubAttributions.pubId');
			builder.leftOuterJoin(
				{ attributionUser: 'Users' },
				'PubAttributions.userId',
				'attributionUser.id',
			);
		}
	};
};

const createOuterWhereClause = (query: PubsQuery) => {
	const { isReleased, hasReviews, collectionIds, excludeCollectionIds, term } = query;
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

export const getPubsById = (pubIds: string[], options: PubGetOptions = {}) => {
	const pubsPromise = Pub.findAll({
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
