import * as types from 'types';
import { Collection, CollectionPub, Pub } from 'server/models';
import { bucketBy, indexById } from 'utils/arrays';
import { getPrimaryCollection } from 'utils/collections/primary';
import { assert } from 'utils/assert';

import { ScopeKind, ByScopeKind, createByScopeKind } from '../../facets';

export type ScopeStack = {
	kind: ScopeKind;
	id: string;
}[];

export type ScopeStacksById = ByScopeKind<Record<string, ScopeStack>>;
export type ScopeIdsByKind = ByScopeKind<string[]>;

export type ResolvedScopeIds = {
	scopeIdsIncludingDependencies: ScopeIdsByKind;
	scopeStacks: ScopeStacksById;
};

const getPrimaryCollectionIdsByPubId = async (
	collectionPubs: types.CollectionPub[],
	collections: types.Collection[],
): Promise<Record<string, string>> => {
	const collectionsById = indexById(collections);
	const collectionPubsByPubId = bucketBy(collectionPubs, (cp) => cp.pubId);
	const primaryCollectionIds: Record<string, string> = {};
	Object.entries(collectionPubsByPubId).forEach(([pubId, collectionPubsForPubId]) => {
		const augmentedCollectionPubs: types.DefinitelyHas<types.CollectionPub, 'collection'>[] =
			collectionPubsForPubId.map((collectionPub) => {
				return {
					...collectionPub,
					collection: collectionsById[collectionPub.collectionId],
				};
			});
		const primaryCollection = getPrimaryCollection(augmentedCollectionPubs);
		if (primaryCollection) {
			primaryCollectionIds[pubId] = primaryCollection.id;
		}
	});
	return primaryCollectionIds;
};

const getIdIndexOfCommunityIds = <Item extends { id: string; communityId: string }>(
	items: Item[],
): Record<string, string> => {
	const idIndex: Record<string, string> = {};
	Object.entries(indexById(items)).forEach(([itemId, item]) => {
		idIndex[itemId] = item.communityId;
	});
	return idIndex;
};

const getScopeStacks = (
	requestedScopes: Partial<ScopeIdsByKind>,
	primaryCollectionIdsByPubId: Record<string, string>,
	communityIdsByPubId: Record<string, string>,
	communityIdsByCollectionId: Record<string, string>,
): ScopeStacksById => {
	const {
		pub: pubIds = [],
		collection: collectionIds = [],
		community: communityIds = [],
	} = requestedScopes;
	const scopeStacksById = createByScopeKind<Record<string, ScopeStack>>(() => ({}));
	pubIds.forEach((pubId) => {
		const communityId = communityIdsByPubId[pubId];
		const primaryCollectionId = primaryCollectionIdsByPubId[pubId];
		if (primaryCollectionId) {
			assert(communityIdsByCollectionId[primaryCollectionId] === communityId);
		}
		const stack = [
			{ kind: 'community' as const, id: communityId },
			{ kind: 'collection' as const, id: primaryCollectionId },
			{ kind: 'pub' as const, id: pubId },
		].filter((scope) => !!scope.id);
		scopeStacksById.pub[pubId] = stack;
	});
	collectionIds.forEach((collectionId) => {
		const communityId = communityIdsByCollectionId[collectionId];
		const stack = [
			{ kind: 'community' as const, id: communityId },
			{ kind: 'collection' as const, id: collectionId },
		];
		scopeStacksById.collection[collectionId] = stack;
	});
	communityIds.forEach((communityId) => {
		scopeStacksById.community[communityId] = [{ kind: 'community' as const, id: communityId }];
	});
	return scopeStacksById;
};

export const resolveScopeIds = async (
	requestedScopes: Partial<ScopeIdsByKind>,
): Promise<ResolvedScopeIds> => {
	const {
		pub: pubIds = [],
		collection: collectionIds = [],
		community: communityIds = [],
	} = requestedScopes;
	const collectionPubs = (
		await CollectionPub.findAll({
			where: { pubId: [...new Set(pubIds)] },
			attributes: ['id', 'pubId', 'collectionId'],
		})
	).map((cp) => cp.toJSON());
	const allCollectionIds = [
		...new Set([...collectionIds, ...collectionPubs.map((cp) => cp.collectionId)]),
	];
	const [pubSequelizeModels, collectionSequelizeModels]: [
		types.SequelizeModel<types.Pub>[],
		types.SequelizeModel<types.Collection>[],
	] = await Promise.all([
		Pub.findAll({ attributes: ['id', 'communityId'], where: { id: pubIds } }),
		Collection.findAll({
			attributes: ['id', 'communityId', 'isPublic', 'kind'],
			where: {
				id: allCollectionIds,
			},
		}),
	]);
	const pubs = pubSequelizeModels.map((pub) => pub.toJSON());
	const collections = collectionSequelizeModels.map((collection) => collection.toJSON());
	const allCommunityIds = [
		...new Set([
			...communityIds,
			...pubs.map((pub) => pub.communityId),
			...collections.map((collection) => collection.communityId),
		]),
	];
	const communityIdsByPubId = getIdIndexOfCommunityIds(pubs);
	const communityIdsByCollectionId = getIdIndexOfCommunityIds(collections);
	const primaryCollectionIdsByPubId = await getPrimaryCollectionIdsByPubId(
		collectionPubs,
		collections,
	);
	return {
		scopeStacks: getScopeStacks(
			requestedScopes,
			primaryCollectionIdsByPubId,
			communityIdsByPubId,
			communityIdsByCollectionId,
		),
		scopeIdsIncludingDependencies: {
			pub: pubIds,
			collection: allCollectionIds,
			community: allCommunityIds,
		},
	};
};
