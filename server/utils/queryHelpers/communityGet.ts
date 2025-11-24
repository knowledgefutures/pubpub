import type { Community as CommunityType, DefinitelyHas } from 'types';

import { Collection, Community, Member, Page, ScopeSummary, SpamTag } from 'server/models';

export default async (locationData, whereQuery) => {
	return Community.findOne({
		where: whereQuery,
		include: [
			{
				model: Page,
				as: 'pages',
				separate: true,
				attributes: {
					exclude: ['updatedAt', 'communityId', 'layout'],
				},
			},
			{
				model: Collection,
				as: 'collections',
				separate: true,
				attributes: {
					exclude: ['layout'],
				},
				include: [
					{
						model: Member,
						as: 'members',
					},
				],
			},
			{
				model: ScopeSummary,
				as: 'scopeSummary',
			},
			{
				model: SpamTag,
				as: 'spamTag',
			},
		],
	}).then((communityResult) => {
		if (!communityResult) {
			throw new Error('Community Not Found');
		}
		return communityResult.toJSON() as DefinitelyHas<
			CommunityType,
			'pages' | 'collections' | 'spamTag' | 'scopeSummary'
		>;
	});
};
