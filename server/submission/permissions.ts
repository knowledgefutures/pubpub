import { Submission } from 'server/models';
import { getScope } from 'server/utils/queryHelpers';
import { initialStatuses, managerStatuses, submitterStatuses } from 'types';

export const getPermissions = async ({ userId, id, collectionId, communityId }) => {
	if (!userId) {
		return {};
	}
	const scopeData = await getScope({
		collectionId,
		communityId,
		loginId: userId,
	});
	const isAuthenticated = scopeData.activePermissions.canManage;
	const submissionData = await Submission.findOne({ where: { id } });

	if (!submissionData) {
		return { create: isAuthenticated };
	}
	return {
		setSubmittedStatus: true,
		manageStatus: true,
		create: isAuthenticated,
		update: isAuthenticated,
		destroy: isAuthenticated,
	};
};

export const canUpdate = async ({ userId, collectionId, status, id }) => {
	const { status: oldStatus, pubId } = await Submission.findOne({ where: { id } });
	const {
		activePermissions: { canManage },
	} = await getScope({ pubId, loginId: userId, collectionId });
	const canSubmitPub =
		canManage && submitterStatuses.includes(status) && initialStatuses.includes(oldStatus);
	const canManagePub =
		canManage && managerStatuses.includes(status) && !initialStatuses.includes(oldStatus);
	return canSubmitPub || canManagePub;
};
