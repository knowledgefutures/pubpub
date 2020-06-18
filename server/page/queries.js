import { Page, Community } from 'server/models';
import { setPageSearchData, deletePageSearchData } from 'server/utils/search';
import { slugifyString } from 'utils/strings';
import { generateHash } from 'utils/hashes';

import { sanitizePageHtml } from './sanitizePageHtml';

export const createPage = (inputValues) => {
	return Page.create({
		communityId: inputValues.communityId,
		title: inputValues.title,
		slug: inputValues.slug,
		description: inputValues.description,
		isPublic: false,
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
				newPage.id,
				...oldNavigation.slice(1, oldNavigation.length),
			];
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

export const updatePage = (inputValues, updatePermissions) => {
	// Filter to only allow certain fields to be updated
	const filteredValues = {};
	Object.keys(inputValues).forEach((key) => {
		if (updatePermissions.includes(key)) {
			filteredValues[key] = inputValues[key];
		}
	});
	if (filteredValues.slug) {
		filteredValues.slug = slugifyString(filteredValues.slug);
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
