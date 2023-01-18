import * as types from 'types';
import { DepositTarget } from 'server/models';

/**
 * Get the primary deposit target for a Community. The primary deposit target is currently
 * the first one created for the Community. Eventually, we will allow users to select the
 * primary deposit target when a Community has more than one.
 */
export const getCommunityDepositTarget = async (
	communityId: string,
	includeCredentials = false,
): Promise<types.Maybe<types.DepositTarget>> => {
	const depositTarget = await DepositTarget.findOne({
		where: {
			communityId,
		},
	});

	if (!depositTarget) {
		return undefined;
	}

	const depositTargetJson = {
		...depositTarget.get({ plain: true }),
		isPubPubManaged: Boolean(depositTarget.username),
	};

	if (includeCredentials) {
		return depositTargetJson;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { username, password, passwordInitVec, ...sanitizedDepositTargetJson } =
		depositTargetJson;
	return sanitizedDepositTargetJson;
};
