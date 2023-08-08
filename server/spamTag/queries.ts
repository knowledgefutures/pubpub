import * as types from 'types';
import { Community, SpamTag } from 'server/models';

import { SpamStatus } from 'types';
import { expect } from 'utils/assert';
import { getSuspectedCommunitySpamVerdict } from './score';

// Adding a spam tag doesn't imply that the Community _is_ spam, only that we have a score for it.
export const addSpamTagToCommunity = async (communityId: string) => {
	const community = expect(
		await Community.findOne({
			where: { id: communityId },
			include: [{ model: SpamTag, as: 'spamTag' }],
		}),
	) as types.DefinitelyHas<Community, 'spamTag'>;
	const verdict = getSuspectedCommunitySpamVerdict(community);
	const { spamTag } = community;
	if (spamTag) {
		await spamTag.update(verdict);
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

export const getSpamTagForCommunity = async (communityId: string) => {
	const { spamTag } = expect(
		(await Community.findOne({
			where: { id: communityId },
			include: [{ model: SpamTag, as: 'spamTag' }],
		})) as types.DefinitelyHas<Community, 'spamTag'>,
	);
	return spamTag ?? null;
};

export const updateSpamTagForCommunity = async (options: UpdateSpamTagForCommunityOptions) => {
	const { communityId, status } = options;
	const spamTag = await getSpamTagForCommunity(communityId);
	if (spamTag) {
		await spamTag.update({ status, statusUpdatedAt: new Date() });
	} else {
		throw new Error('Community is missing a SpamTag');
	}
};
