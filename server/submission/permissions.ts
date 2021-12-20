import { Collection, Submission, SubmissionWorkflow } from 'server/models';
import { getScope } from 'server/utils/queryHelpers';
import * as types from 'types';

const pubManagerCanChangeStatus = (
	oldStatus: types.SubmissionStatus,
	newStatus: types.SubmissionStatus,
) => {
	return (
		(types.submitterStatuses as readonly string[]).includes(newStatus) &&
		(types.initialStatuses as readonly string[]).includes(oldStatus)
	);
};

const collectionManagerCanChangeStatus = (
	oldStatus: types.SubmissionStatus,
	newStatus: types.SubmissionStatus,
) => {
	return (
		(types.managerStatuses as readonly string[]).includes(newStatus) &&
		!(types.initialStatuses as readonly string[]).includes(oldStatus)
	);
};

type CanCreateOptions = {
	submissionWorkflowId: string;
	userId: string;
};

export const canCreateSubmission = async ({ userId, submissionWorkflowId }: CanCreateOptions) => {
	const workflow: types.SubmissionWorkflow = await SubmissionWorkflow.findOne({
		where: { id: submissionWorkflowId },
	});
	return userId && workflow && workflow.enabled;
};

type CanDeleteOptions = {
	id: string;
	userId: string;
};

export const canDeleteSubmission = async ({ userId, id }: CanDeleteOptions) => {
	const {
		pubId,
		submissionWorkflow: { collection },
	} = await Submission.findOne({
		where: { id },
		include: [
			{
				model: SubmissionWorkflow,
				as: 'submissionWorkflow',
				include: [{ model: Collection, as: 'collection' }],
			},
		],
	});
	const [
		{
			activePermissions: { canManage: canManagePub },
		},
		{
			activePermissions: { canManage: canManageCollection },
		},
	] = await Promise.all([
		getScope({ loginId: userId, pubId }),
		getScope({ loginId: userId, collectionId: collection.id }),
	]);
	return canManagePub || canManageCollection;
};

type CanUpdateOptions = {
	id: string;
	userId: string;
	status: types.SubmissionStatus;
};

export const canUpdateSubmission = async ({ userId, status, id }: CanUpdateOptions) => {
	const {
		status: oldStatus,
		pubId,
		submissionWorkflow: { collection },
	} = await Submission.findOne({
		where: { id },
		include: [
			{
				model: SubmissionWorkflow,
				as: 'submissionWorkflow',
				include: [{ model: Collection, as: 'collection' }],
			},
		],
	});

	const [
		{
			activePermissions: { canManage: canManagePub },
		},
		{
			activePermissions: { canManage: canManageCollection },
		},
	] = await Promise.all([
		getScope({ loginId: userId, pubId }),
		getScope({ loginId: userId, collectionId: collection.id }),
	]);

	const canChangeStatusAsSubmitter = canManagePub && pubManagerCanChangeStatus(oldStatus, status);
	const canChangeStatusAsManager =
		canManageCollection && collectionManagerCanChangeStatus(oldStatus, status);
	return canChangeStatusAsManager || canChangeStatusAsSubmitter;
};
