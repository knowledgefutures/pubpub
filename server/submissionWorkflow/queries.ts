import { SubmissionWorkflow } from 'server/models';
import { OmitSequelizeProvidedFields } from 'types/util';
import * as types from 'types';

type Props = OmitSequelizeProvidedFields<types.SubmissionWorkflow>;
type Update = Partial<Props>;

export const createSubmissionWorkflow = async (props: Props) => {
	const {
		collectionId,
		enabled,
		introText,
		instructionsText,
		emailText,
		title,
		targetEmailAddress,
	} = props;
	const submissionWorkflow = {
		enabled,
		instructionsText,
		emailText,
		introText,
		title,
		targetEmailAddress,
		collectionId,
	};
	return SubmissionWorkflow.create(submissionWorkflow);
};

export const updateSubmissionWorkflow = async (update: Update) => {
	const {
		collectionId,
		enabled,
		instructionsText,
		emailText,
		introText,
		title,
		targetEmailAddress,
	} = update;
	await SubmissionWorkflow.update(
		{
			enabled,
			instructionsText,
			emailText,
			targetEmailAddress,
			introText,
			title,
		},
		{ where: { collectionId } },
	);
};

export const destroySubmissionWorkFlow = ({ id }: { id: string }) => {
	return SubmissionWorkflow.destroy({
		where: { id },
	});
};
