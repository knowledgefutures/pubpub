import type { InitialData, Maybe, PubsQueryOrdering, SanitizedPubData } from 'types';

import { getPubsById, queryPubIds } from 'server/pub/queryMany';
import {
	type LayoutBlock,
	type LayoutBlockPubs,
	type LayoutPubsByBlock,
	maxPubsPerBlock,
	type PubSortOrder,
} from 'utils/layout';

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

const getPubIdsForLayoutBlock = async (
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

export const getPubIdsForLayout = async ({
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
		// biome-ignore lint/performance/noAwaitInLoops: shhhhhh
		const pubIdsForBlock = await getPubIdsForLayoutBlock(
			block.content,
			communityId,
			Array.from(seenPubIds),
			collectionId,
		);
		if (!allowDuplicatePubs) {
			pubIdsForBlock.forEach((id) => seenPubIds.add(id));
		}
		pubIdsByBlockId[block.id] = pubIdsForBlock;
	}

	return pubIdsByBlockId;
};

export const getLayoutPubsByBlock = async (
	layoutOptions: GetPubsForLayoutOptions,
): Promise<LayoutPubsByBlock<SanitizedPubData>> => {
	const { alreadyFetchedPubIds = [], blocks, initialData } = layoutOptions;
	const pubIdsByBlockId = await getPubIdsForLayout(layoutOptions);
	const pubsById: Record<string, SanitizedPubData> = {};
	const entries = Object.entries(pubIdsByBlockId);
	await Promise.all(
		entries.map(async (entry) => {
			const [blockId, pubIds] = entry;
			const { content } = blocks.find((b) => b.id === blockId)! as LayoutBlockPubs;
			const { limit } = content;
			const fetchablePubIds = pubIds.filter((id) => !alreadyFetchedPubIds.includes(id));
			const pubsForBlock = await getPubsForPubIds(fetchablePubIds, initialData);
			const limitedPubs = pubsForBlock.slice(0, limit || Infinity);
			limitedPubs.forEach((pub) => {
				pubsById[pub.id] = pub;
			});
		}),
	);
	return {
		pubIdsByBlockId,
		pubsById,
	};
};
