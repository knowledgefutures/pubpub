import { getScope } from 'server/utils/queryHelpers';

export const canManageSubmissionWorkflow = async ({ userId, collectionId }) => {
	const {
		activePermissions: { canManage },
	} = await getScope({ collectionId, loginId: userId });
	return canManage;
};
