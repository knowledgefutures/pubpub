import { SingleScopeId } from 'facets';
import { getScope } from 'server/utils/queryHelpers';

export const canUserUpdateFacetsForScope = async (scopeId: SingleScopeId, userId: string) => {
	const {
		activePermissions: { canManage },
	} = await getScope({ ...scopeId, loginId: userId });
	return canManage;
};
