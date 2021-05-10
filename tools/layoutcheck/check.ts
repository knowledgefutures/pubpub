/* eslint-disable no-console */
import { diffArrays } from 'diff';

import { LayoutBlock, resolveLayoutPubsByBlock } from 'utils/layout';
import { Community, InitialData } from 'types';
import { getInitialData } from 'server/utils/initData';
import { Community as CommunityModel, Page, Collection } from 'server/models';
import { getLayoutPubsByBlock as new_getLayoutPubsByBlock } from 'server/utils/layouts';
import { arraysAreEqual } from 'utils/arrays';
import { forEach } from '../migrations/util';

import { getPubsByBlockIndex as old_getPubsByBlockIndex } from './render';
import { getPubsForLayout as old_getPubsForLayout } from './query';

const {
	argv: { community: scopeToCommunitySubdomain },
} = require('yargs');

const getFakeInitialData = (communitySubdomain: string) => {
	return getInitialData({
		headers: {},
		params: {},
		query: {},
		hostname: `${communitySubdomain}.pubpub.org`,
	});
};

const getOldPubIdsByBlock = async (
	blocks: LayoutBlock[],
	initialData: InitialData,
	collectionId?: string,
) => {
	const pubs = await old_getPubsForLayout({
		blocks,
		initialData,
		collectionId,
		forLayoutEditor: false,
	});
	return old_getPubsByBlockIndex(blocks, pubs, { collectionId })
		.map((list, idx) => (blocks[idx].type === 'pubs' ? list.map((pub) => pub.id) : null))
		.filter((x): x is string[] => !!x);
};

const getNewPubIdsByBlock = async (
	blocks: LayoutBlock[],
	initialData: InitialData,
	collectionId?: string,
) => {
	const layoutPubsByBlock = await new_getLayoutPubsByBlock({
		collectionId,
		initialData,
		blocks,
	});
	const pubsByBlockId = await resolveLayoutPubsByBlock(layoutPubsByBlock, blocks);
	return blocks.map((block) => pubsByBlockId[block.id]?.map((pub) => pub.id)).filter((x) => x);
};

const idsEqual = (oldIds: string[][], newIds: string[][]) => {
	if (oldIds.length !== newIds.length) {
		return false;
	}
	for (let i = 0; i < oldIds.length; i++) {
		if (!arraysAreEqual(oldIds[i], newIds[i])) {
			return false;
		}
	}
	return true;
};

const summarizeDifferences = (oldIds: string[][], newIds: string[][]) => {
	const oldSet = new Set(oldIds.reduce((a, b) => [...a, ...b], []));
	const newSet = new Set(newIds.reduce((a, b) => [...a, ...b], []));
	const removed = [...oldSet].filter((id) => !newSet.has(id));
	const added = [...newSet].filter((id) => !oldSet.has(id));
	const byBlockDiffs: any[] = [];
	for (let i = 0; i < oldIds.length; i++) {
		const oldIdsInBlock = oldIds[i] || [];
		const newIdsInBlock = newIds[i] || [];
		const blockDiff = diffArrays(oldIdsInBlock, newIdsInBlock);
		byBlockDiffs.push(blockDiff);
	}
	return { removed, added, byBlockDiffs };
};

const checkLayout = async (
	blocks: LayoutBlock[],
	initialData: InitialData,
	label: string,
	collectionId?: string,
) => {
	const oldPubIds = await getOldPubIdsByBlock(blocks, initialData, collectionId);
	const newPubIds = await getNewPubIdsByBlock(blocks, initialData, collectionId);
	const versionsEqual = idsEqual(oldPubIds, newPubIds);
	if (!versionsEqual) {
		const summary = summarizeDifferences(oldPubIds, newPubIds);
		const samePubs = summary.added.length === 0 && summary.removed.length === 0;
		const icon = samePubs ? '🤔' : '🚨';
		console.log(`-> ${icon} ${label}`);
		console.log(`--> +${summary.added.length} -${summary.removed.length}`);
		const blockDiffSummaries = summary.byBlockDiffs
			.map((diff) => {
				let addCount = 0;
				let removeCount = 0;
				diff.forEach((entry) => {
					const { added, removed, count } = entry;
					if (added) {
						addCount += count;
					} else if (removed) {
						removeCount += count;
					}
				});
				return `(+${addCount}/-${removeCount})`;
			})
			.join(' ');
		console.log(`--> ${blockDiffSummaries}`);
	}
};

const checkCommunity = async (community: Community) => {
	console.log(`[${community.subdomain}] ${community.title}`);
	const initialData = await getFakeInitialData(community.subdomain);
	const pages = await Page.findAll({ where: { communityId: community.id } });
	const collections = await Collection.findAll({ where: { communityId: community.id } });
	await forEach(pages, async (page) => {
		if (page.layout) {
			await checkLayout(page.layout, initialData, `Page ${page.slug}`);
		}
	});
	await forEach(collections, async (collection) => {
		if (collection.layout && collection.layout.blocks) {
			await checkLayout(
				collection.layout.blocks,
				initialData,
				`Collection ${collection.slug}`,
				collection.id,
			);
		}
	});
};

const main = async () => {
	const communities = await CommunityModel.findAll({
		where: scopeToCommunitySubdomain ? { subdomain: scopeToCommunitySubdomain } : {},
		order: [['createdAt', 'DESC']],
	});
	await forEach(communities, checkCommunity);
};

main();
