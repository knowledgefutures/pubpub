import { Op } from 'sequelize';

import { Page, Collection } from 'server/models';

const definitelyForbiddenSlugs = ['dash'];

export const slugIsAvailable = async ({ slug, communityId, activeElementId }) => {
	if (definitelyForbiddenSlugs.includes(slug)) {
		return false;
	}
	const [pages, collections] = await Promise.all([
		Page.count({
			where: { communityId: communityId, slug: slug, id: { [Op.not]: activeElementId } },
		}),
		Collection.count({
			where: { communityId: communityId, slug: slug, id: { [Op.not]: activeElementId } },
		}),
	]);
	return pages === 0 && collections === 0;
};

export const findAcceptableSlug = async (desiredSlug, communityId) => {
	const [pages, collections] = await Promise.all([
		Page.findAll({
			attributes: ['slug'],
			where: { communityId: communityId, slug: desiredSlug },
		}),
		Collection.findAll({
			attributes: ['slug'],
			where: { communityId: communityId, slug: desiredSlug },
		}),
	]);
	const allSlugs = [...pages, ...collections].map((item) => item.slug);
	if (allSlugs.includes(desiredSlug)) {
		let suffix = 2;
		// eslint-disable-next-line no-constant-condition
		while (true) {
			const proposedSlug = `${desiredSlug}-${suffix}`;
			if (!allSlugs.includes(proposedSlug)) {
				return proposedSlug;
			}
			suffix++;
		}
	}
	return desiredSlug;
};
