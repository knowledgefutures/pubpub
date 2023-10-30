import { Pub } from 'types';
import { LayoutBlock, LayoutRenderContext, PubSortOrder } from 'types/layout';
import { sortByRank } from 'utils/rank';
import { indexByProperty } from 'utils/arrays';
import { getPubPublishedDate } from 'utils/pub/pubDates';

type PubQuery = {
	collectionIds: string[];
	limit: number;
	pinnedPubIds: string[];
	sort: PubSortOrder;
	sortCollectionIds: string[];
};

type RankedPub = { pub: Pub; rank: string };

const sortPubsByCreationDate = (pubs: Pub[], reversed = false) => {
	const reverseFactor = reversed ? -1 : 1;
	return pubs
		.concat()
		.sort((a, b) => (b.createdAt > a.createdAt ? reverseFactor * 1 : reverseFactor * -1));
};

const sortPubsByPublishDate = (pubs: Pub[], reversed = false) => {
	const reverseFactor = reversed ? -1 : 1;
	const publishDateById = {};
	pubs.forEach((pub) => {
		publishDateById[pub.id] = getPubPublishedDate(pub)?.valueOf();
	});
	return pubs.concat().sort((a, b) => {
		const pubDateA = publishDateById[a.id];
		const pubDateB = publishDateById[b.id];
		if (pubDateA && pubDateB) {
			return reverseFactor * (pubDateB - pubDateA);
		}
		if (pubDateA) {
			return -1 * reverseFactor;
		}
		if (pubDateB) {
			return reverseFactor;
		}
		return 0;
	});
};

const sortPubsByCollectionRank = (pubs: Pub[], collectionIds: string[]): Pub[] => {
	const partitionedPubIds = new Set<string>();
	const collectionIdsToRankedPubsMap: Record<string, RankedPub[]> = {};

	pubs.forEach((pub) => {
		if (pub.collectionPubs) {
			pub.collectionPubs.forEach((collectionPub) => {
				const { collectionId, rank } = collectionPub;
				if (!collectionIdsToRankedPubsMap[collectionId]) {
					collectionIdsToRankedPubsMap[collectionId] = [];
				}
				collectionIdsToRankedPubsMap[collectionId].push({ pub, rank });
			});
		}
	});

	const sortedPubs = collectionIds
		.map((collectionId) => {
			const pubsInCollection = collectionIdsToRankedPubsMap[collectionId];
			if (pubsInCollection) {
				const partition: RankedPub[] = [];
				pubsInCollection.forEach((rankedPub) => {
					const { pub } = rankedPub;
					if (!partitionedPubIds.has(pub.id)) {
						partitionedPubIds.add(pub.id);
						partition.push(rankedPub);
					}
				});
				return sortByRank(partition).map((rp) => rp.pub);
			}
			return [];
		})
		.reduce((a, b) => [...a, ...b], []);

	const unsortedPubs = pubs.filter((pub) => !partitionedPubIds.has(pub.id));
	return [...sortedPubs, ...unsortedPubs];
};

const getPubsForCollectionIds = (pubs: Pub[], collectionIds: string[]): Pub[] => {
	if (collectionIds.length === 0) {
		return pubs;
	}
	const collectionIdsSet = new Set(collectionIds);
	return pubs.filter(
		(pub) =>
			pub.collectionPubs &&
			pub.collectionPubs.some((collectionPub) =>
				collectionIdsSet.has(collectionPub.collectionId),
			),
	);
};

const sortPubsLegacy = (pubs: Pub[]) => {
	return pubs.concat().sort((a, b) => {
		const aRank = (a.collectionPubs && a.collectionPubs[0] && a.collectionPubs[0].rank) || '';
		const bRank = (b.collectionPubs && b.collectionPubs[0] && b.collectionPubs[0].rank) || '';
		if (aRank < bRank) {
			return -1;
		}
		if (aRank > bRank) {
			return 1;
		}
		if (a.createdAt > b.createdAt) {
			return -1;
		}
		if (a.createdAt < b.createdAt) {
			return 1;
		}
		return 0;
	});
};

const sortPubs = (pubs: Pub[], sort: PubSortOrder, sortCollectionIds: string[]) => {
	if (sort === 'collection-rank') {
		return sortPubsByCollectionRank(pubs, sortCollectionIds);
	}
	if (sort === 'creation-date' || sort === 'creation-date-reversed') {
		return sortPubsByCreationDate(pubs, sort === 'creation-date-reversed');
	}
	if (sort === 'publish-date' || sort === 'publish-date-reversed') {
		return sortPubsByPublishDate(pubs, sort === 'publish-date-reversed');
	}
	if (sort === 'legacy') {
		return sortPubsLegacy(pubs);
	}
	return pubs;
};

const createPubsPool = (pubs: Pub[]) => {
	const consumedPubIds = new Set<string>();
	const pubsById = indexByProperty(pubs, 'id') as Record<string, Pub>;

	const queryAndConsumePubs = (query: PubQuery): Pub[] => {
		const { pinnedPubIds, collectionIds, sort, sortCollectionIds, limit } = query;
		const matchingPubs = getPubsForCollectionIds(pubs, collectionIds);
		const pinnedPubs = pinnedPubIds.map((id) => pubsById[id]).filter((x) => x);
		const pinnedPubIdSet = new Set(pinnedPubIds);
		const unusedPubs = matchingPubs.filter(
			(pub) => !consumedPubIds.has(pub.id) && !pinnedPubIdSet.has(pub.id),
		);
		const sortedPubs = sortPubs(unusedPubs, sort, sortCollectionIds);
		const resolvedPubs = [...pinnedPubs, ...sortedPubs].slice(0, limit);
		resolvedPubs.forEach((pub) => consumedPubIds.add(pub.id));
		return resolvedPubs;
	};

	return { queryAndConsumePubs };
};

export const getPubsByBlockIndex = <P extends Pub>(
	blocks: LayoutBlock[],
	pubs: P[],
	context: LayoutRenderContext = {},
): P[][] => {
	const { collectionId = '' } = context;
	const pool = createPubsPool(pubs);
	return blocks.map((block) => {
		if (block.type === 'pubs') {
			const { content } = block;
			const collectionIds = content.collectionIds || [];
			return pool.queryAndConsumePubs({
				pinnedPubIds: content.pubIds || [],
				collectionIds,
				limit: content.limit || Infinity,
				sort: content.sort || ('legacy' as unknown as any),
				sortCollectionIds: collectionId ? [collectionId] : collectionIds,
			});
		}
		return [];
	}) as P[][];
};
