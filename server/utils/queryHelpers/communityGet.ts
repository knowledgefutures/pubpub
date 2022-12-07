import { Collection, Community, Page, Member, ScopeSummary, SpamTag } from 'server/models';
import { Community as CommunityType, DefinitelyHas } from 'types';

export default (
	locationData,
	whereQuery,
): DefinitelyHas<CommunityType, 'pages' | 'collections'> => {
	return Community.findOne({
		where: whereQuery,
		include: [
			{
				model: Page,
				as: 'pages',
				separate: true,
				attributes: {
					exclude: ['updatedAt', 'communityId'],
				},
			},
			{
				model: Collection,
				as: 'collections',
				separate: true,
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
		return communityResult.toJSON();
	});
};
