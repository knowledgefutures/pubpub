import { Page, Community } from 'server/models';
import { setPageSearchData, deletePageSearchData } from 'server/utils/search';
import { findAcceptableSlug, slugIsAvailable } from 'server/utils/slugs';
import { slugifyString } from 'utils/strings';
import { PubPubError } from 'server/utils/errors';
import { generateHash } from 'utils/hashes';
import { generateDefaultPageLayout } from 'utils/pages';

import { sanitizePageHtml } from './sanitizePageHtml';

export const createPage = async (inputValues, actorId = null) => {
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
	return Page.create(
		{
			communityId: inputValues.communityId,
			title: inputValues.title,
			slug: await findAcceptableSlug(inputValues.slug, inputValues.communityId),
			description: inputValues.description,
			avatar: inputValues.avatar || null,
			isPublic: false,
			layout: generateDefaultPageLayout(),
			viewHash: generateHash(8),
		},
		{ actorId },
	)
		.then((newPage) => {
			setPageSearchData(newPage.id);
			const findCommunity = Community.findOne({
				where: { id: inputValues.communityId },
				attributes: ['id', 'navigation'],
			});
			return Promise.all([newPage, findCommunity]);
		})
		.then(([newPage, communityData]) => {
			const oldNavigation = communityData.toJSON().navigation;
			const newNavigationOutput = [
				oldNavigation[0],
				{ type: 'page', id: newPage.id },
				...oldNavigation.slice(1, oldNavigation.length),
			].filter((x) => x);
			const updateCommunity = Community.update(
				{ navigation: newNavigationOutput },
				{
					where: { id: inputValues.communityId },
				},
			);
			return Promise.all([newPage, updateCommunity]);
		})
		.then(([newPage]) => {
			return newPage;
		});
};

export const updatePage = async (inputValues, updatePermissions, actorId = null) => {
	// Filter to only allow certain fields to be updated
	const filteredValues: Record<string, any> = {};
	Object.keys(inputValues).forEach((key) => {
		if (updatePermissions.includes(key)) {
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
			throw new PubPubError.ForbiddenSlugError(filteredValues.slug, slugStatus);
		}
	}
	if (filteredValues.layout) {
		filteredValues.layout = filteredValues.layout.map((block) => {
			if (block.type !== 'html') {
				return block;
			}
			const cleanedBlock = { ...block };
			cleanedBlock.content.html = sanitizePageHtml(block.content.html);
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

export const destroyPage = (inputValues, actorId = null) => {
	return Page.destroy({
		where: {
			id: inputValues.pageId,
			communityId: inputValues.communityId,
		},
		actorId,
		individualHooks: true,
	})
		.then(() => {
			return Community.findOne({
				where: { id: inputValues.communityId },
				attributes: ['id', 'navigation'],
			});
		})
		.then((communityData) => {
			const oldNavigation = communityData.toJSON().navigation;
			const newNavigationOutput = oldNavigation
				.filter((item) => {
					return item !== inputValues.pageId;
				})
				.map((item) => {
					if (!item.children) {
						return item;
					}
					return {
						...item,
						children: item.children.filter((subitem) => {
							return subitem !== inputValues.pageId;
						}),
					};
				});
			return Community.update(
				{ navigation: newNavigationOutput },
				{
					where: { id: inputValues.communityId },
				},
			);
		})
		.then(() => {
			return deletePageSearchData(inputValues.pageId);
		});
};
