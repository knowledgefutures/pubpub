import { Op } from 'sequelize';

import { Page, Collection } from 'server/models';

const definitelyForbiddenSlugs = ['dash'];

export const slugIsAvailable = async ({ slug, communityId, activeElementId }) => {
	if (definitelyForbiddenSlugs.includes(slug)) {
		return false;
	}
	const [pages, collections] = await Promise.all([
		Page.count({
			where: { communityId, slug, id: { [Op.not]: activeElementId } },
		}),
		Collection.count({
			where: { communityId, slug, id: { [Op.not]: activeElementId } },
		}),
	]);
	return pages === 0 && collections === 0;
};

export const findAcceptableSlug = async (desiredSlug: string, communityId: string) => {
	const [pages, collections] = await Promise.all([
		Page.findAll({
			attributes: ['slug'],
			where: { communityId },
		}),
		Collection.findAll({
			attributes: ['slug'],
			where: { communityId },
		}),
	]);
	const allSlugs = [
		...[...pages, ...collections].map((item) => item.slug),
		...definitelyForbiddenSlugs,
	];
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
