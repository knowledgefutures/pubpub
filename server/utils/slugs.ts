import { Op } from 'sequelize';

import { Page, Collection } from 'server/models';
import { SlugStatus } from 'types';

export const definitelyForbiddenSlugs = [
	'dash',
	'redirects',
	'pubRedirects',
	'pubDocument',
	'pubDownloads',
	'collection',
	'dashboardActivity',
	'dashboardDiscussions',
	'dashboardEdges',
	'dashboardImpact',
	'dashboardMembers',
	'dashboardCommunityOverview',
	'dashboardCollectionOverview',
	'dashboardCustomScripts',
	'dashboardPubOverview',
	'dashboardPage',
	'dashboardPages',
	'dashboardReview',
	'dashboardReviews',
	'dashboardSettings',
	'dashboardCollectionLayout',
	'communityCreate',
	'adminDashboard',
	'login',
	'legal',
	'search',
	'signup',
	'passwordReset',
	'userCreate',
	'user',
	'page',
	'sitemap',
	'robots',
	'noMatch',
	'review',
];

export const slugIsAvailable = async ({
	slug,
	communityId,
	activeElementId,
}): Promise<SlugStatus> => {
	if (definitelyForbiddenSlugs.includes(slug)) {
		return 'reserved';
	}
	const [pages, collections] = await Promise.all([
		Page.count({
			where: { communityId, slug, id: { [Op.not]: activeElementId } },
		}),
		Collection.count({
			where: { communityId, slug, id: { [Op.not]: activeElementId } },
		}),
	]);
	return pages === 0 && collections === 0 ? 'available' : 'used';
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
