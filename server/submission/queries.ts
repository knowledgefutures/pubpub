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

export const createSubmission = async ({ userId, submissionWorkflowId }: CreateOptions) => {
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
	return Submission.create({
		pubId: pub.id,
		submissionWorkflowId,
		status: 'incomplete',
	});
};

type UpdateToStatus = typeof updateToStatuses;
type UpdateOptions = Partial<SubmissionType> & { status: UpdateToStatus };

export const updateSubmission = async (patch: UpdateOptions, sendEmail = false) => {
	const { id, status } = patch;
	const submission: SequelizeModel<SubmissionType> = await Submission.findOne({ where: { id } });
	const previousStatus = submission.status;
	submission.status = status;
	await submission.save();
	if (sendEmail) {
		if (previousStatus === 'incomplete' && status === 'submitted') {
			// Send an email from here
		}
	}

	Submission.update(
		{ status: patch.status },
		{
			where: { id: patch.id },
			individualHooks: true,
		},
	);
};

export const destroySubmission = async ({ id }: { id: string }) =>
	Submission.destroy({
		where: { id },
	});
