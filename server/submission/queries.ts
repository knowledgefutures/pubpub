import { Submission } from 'server/models';
import { Submission as SubmissionType, managerStatuses, submitterStatuses } from 'types';

const updateToStatuses = [...managerStatuses, ...submitterStatuses] as const;

type UpdateToStatus = typeof updateToStatuses;

type PatchType = Partial<SubmissionType> & { status: UpdateToStatus };

export const createSubmission = async ({ pubId }) =>
	Submission.create({
		pubId,
		status: 'incomplete',
	});

export const updateSubmission = async (patch: PatchType) =>
	Submission.update(
		{ status: patch.status },
		{
			where: { id: patch.id },
		},
	);

export const destroySubmission = async ({ id }: { id: string }) =>
	Submission.destroy({
		where: { id },
	});
