import { SubmissionWorkflow } from 'server/models';
import * as types from 'types';
import { OmitSequelizeProvidedFields } from 'types/util';

type Props = OmitSequelizeProvidedFields<types.SubmissionWorkflow>;

type Update = Partial<Props>;

export const createSubmissionWorkflow = async (props: Props) => {
	const {
		collectionId,
		enabled,
		instructionsText,
		emailText,
		layoutBlockContent,
		targetEmailAddress,
	} = props;
	const submissionWorkflow = {
		enabled,
		instructionsText,
		emailText,
		layoutBlockContent,
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
		layoutBlockContent,
		targetEmailAddress,
	} = update;
	await SubmissionWorkflow.update(
		{ enabled, instructionsText, emailText, targetEmailAddress, layoutBlockContent },
		{ where: { collectionId } },
	);
};

export const destroySubmissionWorkFlow = ({ id }: { id: string }) => {
	return SubmissionWorkflow.destroy({
		where: { id },
	});
};
