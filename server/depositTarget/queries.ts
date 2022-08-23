import * as types from 'types';
import { DepositTarget } from 'server/models';

export const getCommunityDepositTarget = (
	communityId: string,
	service: types.DepositTarget['service'] = 'crossref',
): Promise<types.Maybe<types.DepositTarget>> => {
	return DepositTarget.findOne({
		where: {
			communityId,
			service,
		},
	});
};
