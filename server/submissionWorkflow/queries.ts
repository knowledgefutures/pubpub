import { SubmissionWorkflow } from 'server/models';
import { OmitSequelizeProvidedFields } from 'types/util';
import * as types from 'types';

type CreateFields = OmitSequelizeProvidedFields<types.SubmissionWorkflow>;
type UpdateFields = Partial<CreateFields>;

export const createSubmissionWorkflow = async (props: CreateFields) => {
	const {
		collectionId,
		enabled,
		introText,
		instructionsText,
		emailText,
		title,
		targetEmailAddress,
		acceptedText,
		declinedText,
		requireAbstract,
		requireDescription,
	} = props;
	const submissionWorkflow = {
		enabled,
		instructionsText,
		emailText,
		introText,
		title,
		targetEmailAddress,
		collectionId,
		acceptedText,
		declinedText,
		requireAbstract,
		requireDescription,
	};
	return SubmissionWorkflow.create(submissionWorkflow);
};

export const updateSubmissionWorkflow = async (update: UpdateFields) => {
	const {
		collectionId,
		enabled,
		instructionsText,
		emailText,
		introText,
		title,
		targetEmailAddress,
		acceptedText,
		declinedText,
		requireAbstract,
		requireDescription,
	} = update;
	await SubmissionWorkflow.update(
		{
			enabled,
			instructionsText,
			emailText,
			targetEmailAddress,
			introText,
			title,
			acceptedText,
			declinedText,
			requireAbstract,
			requireDescription,
		},
		{ where: { collectionId } },
	);
};

export const destroySubmissionWorkFlow = ({ id }: { id: string }) => {
	return SubmissionWorkflow.destroy({
		where: { id },
	});
};

export const getEnabledSubmissionWorkflowForCollection = (
	collectionId: string,
): Promise<null | types.SubmissionWorkflow> => {
	return SubmissionWorkflow.findOne({ where: { collectionId, enabled: true } });
};
