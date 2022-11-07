import { useState, useEffect, useRef, useMemo } from 'react';
import { usePrevious } from 'react-use';

import { Pub } from 'types';
import { arraysAreEqual, arraysHaveSameElements } from 'utils/arrays';
import {
	LayoutBlock,
	LayoutBlockPubs,
	LayoutPubsByBlock,
	resolveLayoutPubsByBlock,
} from 'utils/layout';
import { apiFetch } from 'client/utils/apiFetch';

type PubBlockContent = LayoutBlockPubs['content'];

const getPubBlocks = (blocks: LayoutBlock[]) =>
	blocks.filter((block): block is LayoutBlockPubs => block.type === 'pubs');

const pubBlockContentDiffers = (first: PubBlockContent, second: PubBlockContent) => {
	if (first.limit !== second.limit || first.sort !== second.sort) {
		return true;
	}
	if (!arraysHaveSameElements(first.collectionIds || [], second.collectionIds || [])) {
		return true;
	}
	if (!arraysHaveSameElements(first.pubIds || [], second.pubIds || [])) {
		return true;
	}
	return false;
};

const shouldRefetchLayoutPubs = (
	previousBlocks: LayoutBlockPubs[],
	nextBlocks: LayoutBlockPubs[],
) => {
	if (!arraysAreEqual(previousBlocks, nextBlocks, (a, b) => a.id === b.id)) {
		return true;
	}
	for (let i = 0; i < nextBlocks.length; i++) {
		const previousBlock = previousBlocks[i];
		const nextBlock = nextBlocks[i];
		if (pubBlockContentDiffers(previousBlock.content, nextBlock.content)) {
			return true;
		}
	}
	return false;
};

const fetchLayoutPubsByBlock = (
	blocks: LayoutBlockPubs[],
	alreadyFetchedPubIds: string[],
	collectionId?: string,
): Promise<LayoutPubsByBlock<Pub>> =>
	apiFetch.post('/api/layout', { blocks, alreadyFetchedPubIds, collectionId });

export const useLayoutPubs = (
	initialPubsByBlock: LayoutPubsByBlock<Pub>,
	layout: LayoutBlock[],
	collectionId?: string,
) => {
	const previousLayout = usePrevious(layout);
	const [pubsById, setPubsById] = useState<Record<string, Pub>>(initialPubsByBlock.pubsById);
	const [requestCount, setRequestCount] = useState(0);
	const requestResolvedFromTime = useRef(0);
	const [pubIdsByBlockId, setPubIdsByBlockId] = useState<Record<string, string[]>>(
		initialPubsByBlock.pubIdsByBlockId,
	);

	const pubsByBlockId = useMemo(
		() => resolveLayoutPubsByBlock({ pubIdsByBlockId, pubsById }, layout),
		[pubIdsByBlockId, pubsById, layout],
	);

	useEffect(() => {
		if (previousLayout && layout && previousLayout !== layout) {
			const previousPubBlocks = getPubBlocks(previousLayout);
			const nextPubBlocks = getPubBlocks(layout);
			if (shouldRefetchLayoutPubs(previousPubBlocks, nextPubBlocks)) {
				const alreadyFetchedPubIds = Object.keys(pubsById);
				const requestInFlightAt = Date.now();
				setRequestCount((c) => c + 1);
				fetchLayoutPubsByBlock(nextPubBlocks, alreadyFetchedPubIds, collectionId).then(
					(nextLayoutPubsByBlock) => {
						if (requestInFlightAt > requestResolvedFromTime.current) {
							requestResolvedFromTime.current = requestInFlightAt;
							setPubsById((currentPubsById) => ({
								...currentPubsById,
								...nextLayoutPubsByBlock.pubsById,
							}));
							setPubIdsByBlockId(nextLayoutPubsByBlock.pubIdsByBlockId);
							setRequestCount((c) => c - 1);
						}
					},
				);
			}
		}
	}, [previousLayout, layout, pubsById, collectionId]);

	return {
		pubsByBlockId,
		allPubs: Object.values(pubsById),
		loadingPubs: requestCount !== 0,
	};
};
