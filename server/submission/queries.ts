import { createPub } from 'server/pub/queries';
import { Collection, Submission, SubmissionWorkflow } from 'server/models';
import {
	Submission as SubmissionType,
	SequelizeModel,
	managerStatuses,
	submitterStatuses,
} from 'types';

const updateToStatuses = [...managerStatuses, ...submitterStatuses] as const;

type CreateOptions = {
	userId: string;
	submissionWorkflowId: string;
};
type UpdateToStatus = typeof updateToStatuses;
type UpdateOptions = Partial<SubmissionType> & { status: UpdateToStatus };

export const createSubmission = async (
	{ userId, submissionWorkflowId }: CreateOptions,
	actorId: string,
) => {
	const { collection } = await SubmissionWorkflow.findOne({
		where: { id: submissionWorkflowId },
		include: [{ model: Collection, as: 'collection' }],
	});
	const pub = await createPub(
		{
			communityId: collection.communityId,
			collectionIds: [collection.id],
		},
		userId,
	);
	return Submission.create(
		{
			pubId: pub.id,
			submissionWorkflowId,
			status: 'incomplete',
		},
		{ actorId },
	);
};

export const updateSubmission = async (
	patch: UpdateOptions,
	actorId: string,
	sendEmail = false,
) => {
	const { id, status } = patch;
	const submission: SequelizeModel<SubmissionType> = await Submission.findOne({ where: { id } });
	const previousStatus = submission.status;
	const isBeingSubmitted = previousStatus === 'incomplete' && status === 'pending';
	if (isBeingSubmitted && sendEmail) {
		// Send an email here
	}
	return Submission.update(
		{
			status: patch.status,
			...(isBeingSubmitted && { submittedAt: new Date().toISOString() }),
		},
		{
			where: { id: patch.id },
			individualHooks: true,
			actorId,
		},
	).then(() => patch);
};

export const destroySubmission = async ({ id }: { id: string }, actorId: string) =>
	Submission.destroy({
		where: { id },
		individualHooks: true,
		actorId,
	});
