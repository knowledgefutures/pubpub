import { Page, Community } from 'server/models';
import { setPageSearchData, deletePageSearchData } from 'server/utils/search';
import { findAcceptableSlug, slugIsAvailable } from 'server/utils/slugs';
import { slugifyString } from 'utils/strings';
import { PubPubError } from 'server/utils/errors';
import { generateHash } from 'utils/hashes';
import { generateDefaultPageLayout } from 'utils/pages';

import { expect } from 'utils/assert';
import { CommunityNavigationEntry } from 'types/navigation';
import { LayoutBlock } from 'utils/layout';
import { sanitizePageHtml } from './sanitizePageHtml';
import { PagePermissions } from './permissions';

export const createPage = async (
	inputValues: {
		communityId: string;
		title: string;
		slug: string;
		description?: string | null;
		avatar?: string | null;
		isPublic?: boolean;
		layout?: LayoutBlock[] | null;
		isNarrowWidth?: boolean | null;
		layoutAllowsDuplicatePubs?: boolean | null;
	},
	actorId: string | null = null,
) => {
	if (inputValues.slug) {
		const desiredSlug = slugifyString(inputValues.slug);
		const slugStatus = await slugIsAvailable({
			slug: desiredSlug,
			communityId: inputValues.communityId,
			activeElementId: null,
		});

		if (slugStatus === 'reserved') {
			throw new PubPubError.ForbiddenSlugError(desiredSlug, slugStatus);
		}
	}
	const newPage = await Page.create(
		{
			communityId: inputValues.communityId,
			title: inputValues.title,
			slug: await findAcceptableSlug(inputValues.slug, inputValues.communityId),
			description: inputValues.description,
			avatar: inputValues.avatar || null,
			isPublic: inputValues.isPublic ?? false,
			layout: inputValues.layout ?? generateDefaultPageLayout(),
			layoutAllowsDuplicatePubs: inputValues.layoutAllowsDuplicatePubs ?? false,
			isNarrowWidth: inputValues.isNarrowWidth,
			viewHash: generateHash(8),
		},
		{ actorId },
	);
	setPageSearchData(newPage.id);
	const findCommunity = Community.findOne({
		where: { id: inputValues.communityId },
		attributes: ['id', 'navigation'],
	});

	const [newPage_1, communityData] = await Promise.all([newPage, findCommunity]);
	const oldNavigation = expect(communityData?.toJSON().navigation);
	const newNavigationOutput: CommunityNavigationEntry[] = [
		oldNavigation[0],
		{ type: 'page' as const, id: newPage_1.id },
		...oldNavigation.slice(1, oldNavigation.length),
	].filter((x) => x);

	const updateCommunity = Community.update(
		{ navigation: newNavigationOutput },
		{
			where: { id: inputValues.communityId },
		},
	);
	const [newPage_2] = await Promise.all([newPage_1, updateCommunity]);
	return newPage_2;
};

export const updatePage = async (
	inputValues: {
		communityId: string;
		pageId: string;
		title?: string;
		slug?: string;
		description?: string | null;
		avatar?: string | null;
		layout?: LayoutBlock[];
	},
	updatePermissions: PagePermissions['update'],
	actorId: string | null = null,
) => {
	// Filter to only allow certain fields to be updated
	const filteredValues = {} as {
		[K in Exclude<
			PagePermissions['update'],
			false | undefined
		>[number]]?: K extends keyof typeof inputValues ? (typeof inputValues)[K] : never;
	};
	Object.keys(inputValues).forEach((key) => {
		if (updatePermissions && updatePermissions.some((x) => x === key)) {
			filteredValues[key] = inputValues[key];
		}
	});
	if (filteredValues.slug) {
		filteredValues.slug = slugifyString(filteredValues.slug);
		const slugStatus = await slugIsAvailable({
			slug: filteredValues.slug,
			communityId: inputValues.communityId,
			activeElementId: inputValues.pageId,
		});
		if (slugStatus !== 'available') {
			throw new PubPubError.ForbiddenSlugError(filteredValues.slug!, slugStatus);
		}
	}
	if (filteredValues.layout) {
		filteredValues.layout = filteredValues.layout.map((block) => {
			if (block.type !== 'html') {
				return block;
			}
			const cleanedBlock = { ...block };
			cleanedBlock.content.html = block.content.html
				? sanitizePageHtml(block.content.html)
				: block.content.html;
			return cleanedBlock;
		});
	}

	return Page.update(filteredValues, {
		where: { id: inputValues.pageId },
		actorId,
		individualHooks: true,
	})
		.then(() => {
			return setPageSearchData(inputValues.pageId);
		})
		.then(() => {
			return filteredValues;
		});
};

export const destroyPage = async (
	inputValues: {
		communityId: string;
		pageId: string;
	},
	actorId: string | null = null,
) => {
	await Page.destroy({
		where: {
			id: inputValues.pageId,
			communityId: inputValues.communityId,
		},
		actorId,
		individualHooks: true,
	});
	const communityData = expect(
		await Community.findOne({
			where: { id: inputValues.communityId },
			attributes: ['id', 'navigation'],
		}),
	);
	const oldNavigation = expect(communityData.toJSON().navigation);
	const newNavigationOutput = oldNavigation
		.filter((item) => {
			return item.id !== inputValues.pageId;
		})
		.map((item_1) => {
			if (!('children' in item_1)) {
				return item_1;
			}
			return {
				...item_1,
				children: item_1.children.filter((subitem) => {
					return subitem.id !== inputValues.pageId;
				}),
			};
		});
	await Community.update(
		{ navigation: newNavigationOutput },
		{
			where: { id: inputValues.communityId },
		},
	);
	return deletePageSearchData(inputValues.pageId);
};
