import * as types from 'types';
import { Community, SpamTag } from 'server/models';

import { SpamStatus } from 'types';
import { getSuspectedCommunitySpamVerdict } from './score';

// Adding a spam tag doesn't imply that the Community _is_ spam, only that we have a score for it.
export const addSpamTagToCommunity = async (communityId: string) => {
	const community: types.SequelizeModel<types.DefinitelyHas<types.Community, 'spamTag'>> =
		await Community.findOne({
			where: { id: communityId },
			include: [{ model: SpamTag, as: 'spamTag' }],
		});
	const verdict = getSuspectedCommunitySpamVerdict(community);
	const { spamTag } = community;
	if (spamTag) {
		await (spamTag as types.SequelizeModel<types.SpamTag>).update(verdict);
		return spamTag;
	}
	const newSpamTag = await SpamTag.create(verdict);
	await Community.update(
		{ spamTagId: newSpamTag.id },
		{
			where: { id: communityId },
			limit: 1,
			// We need individualHooks: false so we don't trigger Community's afterUpdate hook,
			// which probably called this function.
			individualHooks: false,
		},
	);
	return newSpamTag;
};

type UpdateSpamTagForCommunityOptions = {
	communityId: string;
	status: SpamStatus;
};

export const getSpamTagForCommunity = async (
	communityId: string,
): Promise<null | types.SequelizeModel<types.SpamTag>> => {
	const { spamTag } = await Community.findOne({
		where: { id: communityId },
		include: [{ model: SpamTag, as: 'spamTag' }],
	});
	return spamTag ?? null;
};

export const updateSpamTagForCommunity = async (options: UpdateSpamTagForCommunityOptions) => {
	const { communityId, status } = options;
	const spamTag = await getSpamTagForCommunity(communityId);
	if (spamTag) {
		await spamTag.update({ status, statusUpdatedAt: new Date().toISOString() });
	} else {
		throw new Error('Community is missing a SpamTag');
	}
};
