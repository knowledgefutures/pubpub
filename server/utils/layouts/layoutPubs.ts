import type { InitialData, Maybe, PubsQueryOrdering, SanitizedPubData } from 'types';

import { QueryTypes } from 'sequelize';

import { sequelize } from 'server/models';
import { getPubsById, queryPubIds } from 'server/pub/queryMany';
import {
	type LayoutBlock,
	type LayoutBlockPubs,
	type LayoutPubsByBlock,
	maxPubsPerBlock,
	type PubSortOrder,
} from 'utils/layout';

import { createLogger } from '../queryHelpers/communityGet';

type BlockContent = LayoutBlockPubs['content'];

const orderingsForSort: Record<PubSortOrder, PubsQueryOrdering> = {
	'collection-rank': { field: 'collectionRank', direction: 'ASC' },
	'creation-date': { field: 'creationDate', direction: 'DESC' },
	'creation-date-reversed': { field: 'creationDate', direction: 'ASC' },
	'publish-date': { field: 'publishDate', direction: 'DESC' },
	'publish-date-reversed': { field: 'publishDate', direction: 'ASC' },
};

const getQueryOrdering = (sort: Maybe<PubSortOrder>): PubsQueryOrdering => {
	const selectedOrdering = sort && orderingsForSort[sort];
	return selectedOrdering || orderingsForSort['creation-date'];
};

type PubWithMetadata = {
	id: string;
	createdAt: Date;
	customPublishedAt: Date | null;
	firstReleaseDate: Date | null;
	collectionPubs: Array<{ collectionId: string; rank: string }>;
};

const getAllPubIdsRaw = async (communityId: string): Promise<PubWithMetadata[]> => {
	const sql = String.raw;

	const query = sql`SELECT 
"Pub"."id", 
"Pub"."createdAt",
"Pub"."customPublishedAt",
MIN("releases"."createdAt") AS "firstReleaseDate",
COALESCE(
	json_agg(
		json_build_object('collectionId', "collectionPubs"."collectionId", 'rank', "collectionPubs"."rank")
		ORDER BY "collectionPubs"."rank"
	) FILTER (WHERE "collectionPubs"."collectionId" IS NOT NULL),
	'[]'
) AS "collectionPubs"
FROM "Pubs" AS "Pub" 
LEFT OUTER JOIN "CollectionPubs" AS "collectionPubs" ON "Pub"."id" = "collectionPubs"."pubId"
LEFT OUTER JOIN "Releases" AS "releases" ON "Pub"."id" = "releases"."pubId"
WHERE "Pub"."communityId" = :communityId
GROUP BY "Pub"."id"`;

	const result = await sequelize.query(query, {
		type: QueryTypes.SELECT,
		replacements: {
			communityId,
		},
	});

	return result as PubWithMetadata[];
};

const getPubsForPubIds = async (pubIds: string[], initialData: InitialData) => {
	return getPubsById(pubIds, {
		isPreview: true,
	}).sanitize(initialData);
};

type GetPubsForLayoutOptions = {
	blocks: LayoutBlock[];
	initialData: InitialData;
	collectionId?: string;
	alreadyFetchedPubIds?: string[];
	allowDuplicatePubs: boolean;
};

const getPublishDate = (pub: PubWithMetadata): Date | null => {
	return pub.customPublishedAt || pub.firstReleaseDate || null;
};

const filterPubsByCollection = (
	pubs: PubWithMetadata[],
	collectionIds: string[],
	scopedCollectionId?: string,
): PubWithMetadata[] => {
	return pubs.filter((pub) => {
		if (scopedCollectionId) {
			const hasScopedCollection = pub.collectionPubs.some(
				(cp) => cp.collectionId === scopedCollectionId,
			);
			if (!hasScopedCollection) {
				return false;
			}
		}

		if (collectionIds.length === 0) {
			return true;
		}

		return pub.collectionPubs.some((cp) => collectionIds.includes(cp.collectionId));
	});
};

const sortPubs = (
	pubs: PubWithMetadata[],
	sort: Maybe<PubSortOrder>,
	collectionIds: string[],
): PubWithMetadata[] => {
	const sorted = [...pubs];
	const ordering = getQueryOrdering(sort);

	sorted.sort((a, b) => {
		let aValue: number | null = null;
		let bValue: number | null = null;

		if (ordering.field === 'collectionRank') {
			const getMinRank = (pub: PubWithMetadata) => {
				const relevantRanks = pub.collectionPubs
					.filter(
						(cp) =>
							collectionIds.length === 0 || collectionIds.includes(cp.collectionId),
					)
					.map((cp) => parseFloat(cp.rank));
				return relevantRanks.length > 0 ? Math.min(...relevantRanks) : Number.MAX_VALUE;
			};
			aValue = getMinRank(a);
			bValue = getMinRank(b);
		} else if (ordering.field === 'creationDate') {
			aValue = a.createdAt.getTime();
			bValue = b.createdAt.getTime();
		} else if (ordering.field === 'publishDate') {
			const aDate = getPublishDate(a);
			const bDate = getPublishDate(b);
			aValue = aDate ? aDate.getTime() : Number.MIN_VALUE;
			bValue = bDate ? bDate.getTime() : Number.MIN_VALUE;
		}

		if (aValue === null || bValue === null) {
			return 0;
		}

		return ordering.direction === 'ASC' ? aValue - bValue : bValue - aValue;
	});

	return sorted;
};

const getPubIdsForBlock = (
	allPubs: PubWithMetadata[],
	blockContent: BlockContent,
	excludedPubIds: Set<string>,
	currentBlockPinnedIds: Set<string>,
	scopedCollectionId?: string,
): string[] => {
	const { limit, collectionIds = [], pubIds: pinnedPubIds = [] } = blockContent;
	const resolvedLimit = limit || maxPubsPerBlock;

	const pubsById = new Map(allPubs.map((pub) => [pub.id, pub]));

	const availablePinnedPubs = pinnedPubIds
		.map((id) => pubsById.get(id))
		.filter((pub): pub is PubWithMetadata => {
			if (!pub) {
				return false;
			}
			if (scopedCollectionId) {
				return pub.collectionPubs.some((cp) => cp.collectionId === scopedCollectionId);
			}
			return true;
		});

	const pinnedPubIdSet = new Set(availablePinnedPubs.map((pub) => pub.id));

	const otherPubs = allPubs.filter((pub) => {
		if (pinnedPubIdSet.has(pub.id)) {
			return false;
		}
		if (excludedPubIds.has(pub.id) && !currentBlockPinnedIds.has(pub.id)) {
			return false;
		}
		return true;
	});

	const filteredOtherPubs = filterPubsByCollection(otherPubs, collectionIds, scopedCollectionId);
	const sortedOtherPubs = sortPubs(filteredOtherPubs, blockContent.sort, collectionIds);

	const orderedPinnedPubIds = pinnedPubIds.filter((id) => pinnedPubIdSet.has(id));

	return [...orderedPinnedPubIds, ...sortedOtherPubs.map((pub) => pub.id)].slice(
		0,
		resolvedLimit,
	);
};

const getPubIdsForLayoutBlockOld = async (
	blockContent: BlockContent,
	communityId: string,
	excludeNonPinnedPubIds: string[],
	scopedCollectionId?: string,
) => {
	const { limit, collectionIds = [], pubIds: pinnedPubIds = [] } = blockContent;
	const resolvedLimit = limit || maxPubsPerBlock;

	const [availablePinnedPubIds, otherPubIds] = await Promise.all([
		queryPubIds({
			communityId,
			scopedCollectionId,
			withinPubIds: pinnedPubIds,
			limit: resolvedLimit,
		}),
		queryPubIds({
			communityId,
			collectionIds: collectionIds.length ? collectionIds : null,
			scopedCollectionId,
			excludePubIds: [...excludeNonPinnedPubIds, ...pinnedPubIds],
			ordering: getQueryOrdering(blockContent.sort),
			limit: resolvedLimit,
		}),
	]);

	return [
		...availablePinnedPubIds
			.concat()
			.sort((a, b) => pinnedPubIds.indexOf(a) - pinnedPubIds.indexOf(b)),
		...otherPubIds,
	].slice(0, limit || Infinity);
};

const getPubIdsForLayoutOld = async ({
	blocks,
	initialData,
	collectionId,
	allowDuplicatePubs,
}: GetPubsForLayoutOptions): Promise<Record<string, string[]>> => {
	const { id: communityId } = initialData.communityData;
	const pubBlocks = blocks.filter((block): block is LayoutBlockPubs => block.type === 'pubs');
	const pubIdsByBlockId: Record<string, string[]> = {};
	const seenPubIds = new Set<string>();

	for (const block of pubBlocks) {
		// biome-ignore lint/performance/noAwaitInLoops: sequential processing needed for deduplication
		const pubIdsForBlock = await getPubIdsForLayoutBlockOld(
			block.content,
			communityId,
			Array.from(seenPubIds),
			collectionId,
		);

		if (!allowDuplicatePubs) {
			pubIdsForBlock.forEach((id) => {
				seenPubIds.add(id);
			});
		}

		pubIdsByBlockId[block.id] = pubIdsForBlock;
	}

	return pubIdsByBlockId;
};

const getPubIdsForLayoutNew = async ({
	blocks,
	initialData,
	collectionId,
	allowDuplicatePubs,
}: GetPubsForLayoutOptions): Promise<Record<string, string[]>> => {
	const { id: communityId } = initialData.communityData;
	const pubBlocks = blocks.filter((block): block is LayoutBlockPubs => block.type === 'pubs');
	const pubIdsByBlockId: Record<string, string[]> = {};
	const seenPubIds = new Set<string>();

	const { log, end } = createLogger('getPubIdsForLayout');
	const allPubs = await log('allPubsIdRaw', getAllPubIdsRaw(communityId));
	end();

	for (const block of pubBlocks) {
		const currentBlockPinnedIds = new Set(block.content.pubIds || []);
		const pubIdsForBlock = getPubIdsForBlock(
			allPubs,
			block.content,
			seenPubIds,
			currentBlockPinnedIds,
			collectionId,
		);

		if (!allowDuplicatePubs) {
			pubIdsForBlock.forEach((id) => {
				seenPubIds.add(id);
			});
		}

		pubIdsByBlockId[block.id] = pubIdsForBlock;
	}

	return pubIdsByBlockId;
};

export const getPubIdsForLayout = async (
	options: GetPubsForLayoutOptions,
): Promise<Record<string, string[]>> => {
	const { blocks, initialData } = options;
	const communitySlug =
		initialData.communityData.subdomain || initialData.communityData.domain || '';
	const useOldMethod = shouldUsePerBlockFetching(blocks, communitySlug);

	return useOldMethod ? getPubIdsForLayoutOld(options) : getPubIdsForLayoutNew(options);
};

const shouldUsePerBlockFetching = (blocks: LayoutBlock[], communitySlug: string): boolean => {
	const pubBlocks = blocks.filter((block): block is LayoutBlockPubs => block.type === 'pubs');

	if (pubBlocks.length === 1) {
		return true;
	}

	const largeCommunitySlugs = process.env.LARGE_COMMUNITY_SLUGS
		? process.env.LARGE_COMMUNITY_SLUGS.split(',').map((s) => s.trim())
		: [];

	return largeCommunitySlugs.includes(communitySlug);
};

export const getLayoutPubsByBlock = async (
	layoutOptions: GetPubsForLayoutOptions,
): Promise<LayoutPubsByBlock<SanitizedPubData>> => {
	const { log, end } = createLogger('getLayoutPubsByBlock');
	const { alreadyFetchedPubIds = [], initialData } = layoutOptions;
	const pubIdsByBlockId = await log('getPubIdsForLayout', getPubIdsForLayout(layoutOptions));
	const pubsById: Record<string, SanitizedPubData> = {};

	const allPubIds = [...new Set(Object.values(pubIdsByBlockId).flat())].filter(
		(id) => !alreadyFetchedPubIds.includes(id),
	);

	if (allPubIds.length > 0) {
		const allPubs = await log('getPubsForPubIds', getPubsForPubIds(allPubIds, initialData));

		allPubs.forEach((pub) => {
			pubsById[pub.id] = pub;
		});
	}

	end();

	return {
		pubIdsByBlockId,
		pubsById,
	};
};
