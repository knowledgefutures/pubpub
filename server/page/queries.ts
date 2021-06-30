import { Page, Community } from 'server/models';
import { setPageSearchData, deletePageSearchData } from 'server/utils/search';
import { findAcceptableSlug, slugIsAvailable } from 'server/utils/slugs';
import { slugifyString } from 'utils/strings';
import { PubPubError } from 'server/utils/errors';
import { generateHash } from 'utils/hashes';
import { generateDefaultPageLayout } from 'utils/pages';

import { sanitizePageHtml } from './sanitizePageHtml';

export const createPage = async (inputValues) => {
	return Page.create({
		communityId: inputValues.communityId,
		title: inputValues.title,
		slug: await findAcceptableSlug(inputValues.slug, inputValues.communityId),
		description: inputValues.description,
		avatar: inputValues.avatar || null,
		isPublic: false,
		layout: generateDefaultPageLayout(),
		viewHash: generateHash(8),
	})
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

export const updatePage = async (inputValues, updatePermissions) => {
	// Filter to only allow certain fields to be updated
	const filteredValues = {};
	Object.keys(inputValues).forEach((key) => {
		if (updatePermissions.includes(key)) {
			filteredValues[key] = inputValues[key];
		}
	});
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'slug' does not exist on type '{}'.
	if (filteredValues.slug) {
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'slug' does not exist on type '{}'.
		filteredValues.slug = slugifyString(filteredValues.slug);
		const available = await slugIsAvailable({
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'slug' does not exist on type '{}'.
			slug: filteredValues.slug,
			communityId: inputValues.communityId,
			activeElementId: inputValues.pageId,
		});
		if (!available) {
			throw new PubPubError.InvalidFieldsError('slug');
		}
	}
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'layout' does not exist on type '{}'.
	if (filteredValues.layout) {
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'layout' does not exist on type '{}'.
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
	})
		.then(() => {
			return setPageSearchData(inputValues.pageId);
		})
		.then(() => {
			return filteredValues;
		});
};

export const destroyPage = (inputValues) => {
	return Page.destroy({
		where: {
			id: inputValues.pageId,
			communityId: inputValues.communityId,
		},
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
