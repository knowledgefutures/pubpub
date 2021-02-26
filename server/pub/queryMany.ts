import { QueryTypes, Op } from 'sequelize';
import { QueryBuilder } from 'knex';

import { knex, sequelize, Pub } from 'server/models';
import { buildPubOptions, PubGetOptions } from 'server/utils/queryHelpers';

type PubQueryOrderingField = 'collectionRank' | 'publishDate' | 'updatedDate' | 'creationDate';
export type PubQueryOrdering = { field: PubQueryOrderingField; direction: 'ASC' | 'DESC' };

type PubsQuery = {
	collectionIds?: null | string[];
	communityId: string;
	excludePubIds?: null | string[];
	isReleased?: boolean;
	limit?: null | number;
	offset?: number;
	ordering?: PubQueryOrdering;
	scopedCollectionId?: string;
	withinPubIds?: null | string[];
};

const defaultColumns = {
	pubId: 'Pubs.id',
	creationDate: 'Pubs.createdAt',
	isReleased: knex.raw('array_remove(array_agg("Releases"."id"), null) != Array[]::uuid[]'),
	collectionIds: knex.raw('array_agg(distinct "CollectionPubs"."collectionId")'),
	publishDate: knex.raw('coalesce("Pubs"."customPublishedAt", min("Releases"."createdAt"))'),
	updatedDate: knex.raw('greatest("Pubs"."updatedAt", max("Drafts"."latestKeyAt"))'),
};

const valueAssertedIn = <T>(value: T, range: T[]) => {
	if (range.includes(value)) {
		return value;
	}
	throw new Error(`${value} not in ${range}`);
};

const createColumns = (query: PubsQuery) => {
	const { scopedCollectionId } = query;
	const collectionRank = scopedCollectionId
		? knex.raw('(array_agg("scopedCollectionPub"."rank"))[1]')
		: knex.raw('(array_agg("CollectionPubs"."rank"))[1]');
	return { ...defaultColumns, collectionRank };
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
	const { scopedCollectionId } = query;
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
	};
};

const createOuterWhereClause = (query: PubsQuery) => {
	const { isReleased, collectionIds } = query;
	return (builder: QueryBuilder) => {
		if (typeof isReleased === 'boolean') {
			builder.where({ isReleased });
		}
		if (collectionIds) {
			builder.whereRaw('?::uuid[] && "collectionIds"', [collectionIds]);
		}
	};
};

const createOrderLimitOffset = (query: PubsQuery) => {
	const { offset, limit, ordering } = query;
	return (builder: QueryBuilder) => {
		if (ordering) {
			const { field, direction } = ordering;
			const paranoidDirection = valueAssertedIn(direction.toLowerCase(), ['asc', 'desc']);
			builder.orderByRaw(`?? ${paranoidDirection} nulls last`, [field]);
		}
		if (typeof limit === 'number') {
			builder.limit(limit);
		}
		if (typeof offset === 'number') {
			builder.offset(offset);
		}
	};
};

const createPubIdsQueryString = (query: PubsQuery) => {
	const columns = createColumns(query);
	const joins = createJoins(query);
	const orderLimitOffset = createOrderLimitOffset(query);
	const innerWhereClause = createInnerWhereClause(query);
	const outerWhereClause = createOuterWhereClause(query);
	return knex
		.select('pubId')
		.from(function(this: QueryBuilder) {
			const outer = this.from(function(this: QueryBuilder) {
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
		.toString();
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
	const queryString = createPubIdsQueryString(query);
	const results = await sequelize.query(queryString, { type: QueryTypes.SELECT });
	return results.map((r) => r.pubId);
};

export const getPubsById = async (pubIds: string[], options: PubGetOptions = {}) => {
	const pubs = await Pub.findAll({
		where: { id: { [Op.in]: pubIds } },
		...buildPubOptions(options),
	});
	return sortPubsByListOfIds(pubs, pubIds);
};
