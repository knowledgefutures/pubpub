import * as types from 'types';
import { Collection, Submission, SubmissionWorkflow } from 'server/models';
import { createPub } from 'server/pub/queries';
import { defer } from 'server/utils/deferred';
import { getPub } from 'server/utils/queryHelpers';
import { getEmptyDoc } from 'client/components/Editor';

import { expect } from 'utils/assert';
import { sendSubmissionEmail } from './emails';
import { appendAbstractToPubDraft } from './abstract';

const updateToStatuses = [...types.managerStatuses, ...types.submitterStatuses] as const;

type CreateOptions = {
	userId: string;
	submissionWorkflowId: string;
};
type UpdateToStatus = typeof updateToStatuses;

type UpdateOptions = Partial<types.Submission> & {
	id: string;
	abstract?: types.DocJson;
	status?: UpdateToStatus;
	skipEmail?: boolean;
	customEmailText?: types.DocJson;
};

export const getSubmissionById = async (
	id: string,
): Promise<
	null | (Omit<types.Submission, 'pub'> & { pub: types.DefinitelyHas<types.Pub, 'members'> })
> => {
	const submission = await Submission.findOne({
		where: { id },
	});
	if (submission) {
		const pub = (await getPub(
			{ id: submission.pubId },
			{ getMembers: true },
		)) as types.DefinitelyHas<types.Pub, 'members'>;
		return {
			...submission.toJSON(),
			pub,
		};
	}
	return null;
};

export const createSubmission = async ({ userId, submissionWorkflowId }: CreateOptions) => {
	const { collection } = expect(
		await SubmissionWorkflow.findOne({
			where: { id: submissionWorkflowId },
			include: [{ model: Collection, as: 'collection' }],
		}),
	) as types.DefinitelyHas<SubmissionWorkflow, 'collection'>;
	const pub = await createPub(
		{
			communityId: collection.communityId,
			collectionIds: [collection.id],
			titleKind: 'New Submission',
		},
		userId,
	);
	return Submission.create(
		{
			pubId: pub.id,
			submissionWorkflowId,
			status: 'incomplete',
			abstract: getEmptyDoc(),
		},
		{ actorId: userId },
	);
};

export const updateSubmission = async (options: UpdateOptions, actorId: string) => {
	const { id, status, customEmailText, skipEmail, abstract } = options;
	const submission = (await getSubmissionById(id))!;
	const previousStatus = submission.status;
	const isBeingSubmitted = previousStatus === 'incomplete' && status === 'received';

	await Submission.update(
		{
			status,
			abstract,
			...(isBeingSubmitted && { submittedAt: new Date() }),
		},
		{
			where: { id: options.id },
			individualHooks: true,
			actorId,
		},
	);

	if (isBeingSubmitted) {
		await appendAbstractToPubDraft(submission.pubId, submission.abstract);
	}

	defer(async () => {
		if (!skipEmail) {
			await sendSubmissionEmail({
				previousStatus,
				submission: (await getSubmissionById(id))!,
				customText: customEmailText,
			});
		}
	});

	return { status };
};

export const destroySubmission = async ({ id }: { id: string }, actorId: string) =>
	Submission.destroy({
		where: { id },
		individualHooks: true,
		actorId,
	});
