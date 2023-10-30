import { indexByProperty, splitArrayOn } from 'utils/arrays';

import { LayoutPubsByBlock, LayoutBlock, LayoutBlockPubs } from '../../types/layout';

export const resolveLayoutPubsByBlock = <T extends { id: string }>(
	pubsByBlock: LayoutPubsByBlock<T>,
	blocks: LayoutBlock[],
): Record<string, T[]> => {
	const { pubIdsByBlockId, pubsById } = pubsByBlock;
	const pubLayoutBlocks = blocks.filter((b): b is LayoutBlockPubs => b.type === 'pubs');
	const layoutblocksById = indexByProperty(pubLayoutBlocks, 'id');
	const resolved: Record<string, T[]> = {};
	Object.entries(pubIdsByBlockId).forEach(([blockId, pubIds]) => {
		const block = layoutblocksById[blockId];
		if (block) {
			const { limit, pubIds: pinnedPubIds = [] } = block.content;
			const pubsForBlock = pubIds.map((id) => pubsById[id]).filter((x): x is T => !!x);
			const [pinnedPubs, otherPubs] = splitArrayOn(pubsForBlock, (pub) =>
				pinnedPubIds.includes(pub.id),
			);
			const orderedPubs = [
				...pinnedPubs.sort(
					(a, b) => pinnedPubIds.indexOf(a.id) - pinnedPubIds.indexOf(b.id),
				),
				...otherPubs,
			];
			resolved[blockId] = orderedPubs.slice(0, limit || Infinity);
		}
	});
	return resolved;
};
