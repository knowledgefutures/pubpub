import * as types from 'types';
import { DepositTarget } from 'server/models';

/**
 * Get the primary deposit target for a Community. The primary deposit target is currently
 * the first one created for the Community. Eventually, we will allow users to select the
 * primary deposit target when a Community has more than one.
 */
export const getCommunityDepositTarget = (
	communityId: string,
	includeCredentials = false,
): Promise<types.Maybe<types.DepositTarget>> => {
	return DepositTarget.findOne({
		where: {
			communityId,
		},
		attributes: {
			exclude: includeCredentials ? [] : ['username', 'password', 'passwordInitVec'],
		},
	});
};
