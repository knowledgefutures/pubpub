import { queryPubIds, getPubsById, PubQueryOrdering } from 'server/pub/queryMany';
import { sanitizePub, SanitizedPubData } from 'server/utils/queryHelpers';
import {
	LayoutBlockPubs,
	LayoutBlock,
	LayoutPubsByBlock,
	PubSortOrder,
	maxPubsPerBlock,
} from 'utils/layout';
import { InitialData, Maybe } from 'utils/types';

type BlockContent = LayoutBlockPubs['content'];

const orderingsForSort: Partial<Record<PubSortOrder, PubQueryOrdering>> = {
	'collection-rank': { field: 'collectionRank', direction: 'ASC' },
	'creation-date': { field: 'creationDate', direction: 'DESC' },
	'creation-date-reversed': { field: 'creationDate', direction: 'ASC' },
	'publish-date': { field: 'publishDate', direction: 'DESC' },
	'publish-date-reversed': { field: 'publishDate', direction: 'ASC' },
};

const getQueryOrdering = (sort: Maybe<PubSortOrder>): PubQueryOrdering => {
	const selectedOrdering = sort && orderingsForSort[sort];
	return selectedOrdering || { field: 'creationDate', direction: 'DESC' };
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
	];
};

const getPubsForPubIds = async (pubIds: string[], initialData: InitialData) => {
	const pubs = await getPubsById(pubIds, {
		isPreview: true,
		getMembers: true,
		getCollections: true,
	});
	return pubs
		.map((pub) => sanitizePub(pub.toJSON(), initialData))
		.filter((pub): pub is SanitizedPubData => !!pub);
};

type GetPubsForLayoutOptions = {
	blocks: LayoutBlock[];
	initialData: InitialData;
	collectionId?: string;
	alreadyFetchedPubIds?: string[];
};

export const getPubIdsForLayout = async ({
	blocks,
	initialData,
	collectionId,
}: GetPubsForLayoutOptions): Promise<Record<string, string[]>> => {
	const { id: communityId } = initialData.communityData;
	const pubBlocks = blocks.filter((block): block is LayoutBlockPubs => block.type === 'pubs');
	const pubIdsByBlockId: Record<string, string[]> = {};
	const seenPubIds = new Set<string>();
	// eslint-disable-next-line no-restricted-syntax
	for (const block of pubBlocks) {
		// eslint-disable-next-line no-await-in-loop
		const pubIdsForBlock = await getPubIdsForLayoutBlock(
			block.content,
			communityId,
			Array.from(seenPubIds),
			collectionId,
		);
		pubIdsForBlock.forEach((id) => seenPubIds.add(id));
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
