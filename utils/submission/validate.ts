import { DocJson, SubmissionWorkflow } from 'types';
import {
	RecordValidator,
	isNonEmptyDocJson,
	isNonEmptyString,
	isAlwaysValid,
	validate,
	isTruthyAnd,
	ValidatedFields,
} from 'utils/validate';

export type ValidatedSubmission = {
	title: string;
	description: undefined | string;
	abstract: null | DocJson;
};

export type ValidatedSubmissionFields = ValidatedFields<ValidatedSubmission>;

export const createSubmissionValidator = (
	workflow: SubmissionWorkflow,
): RecordValidator<ValidatedSubmission> => {
	const { requireAbstract, requireDescription } = workflow;
	return {
		title: isNonEmptyString,
		description: requireDescription ? isTruthyAnd(isNonEmptyString) : isAlwaysValid,
		abstract: requireAbstract ? isTruthyAnd(isNonEmptyDocJson) : isAlwaysValid,
	};
};

export const validateSubmission = (
	parts: ValidatedSubmission,
	validator: RecordValidator<ValidatedSubmission>,
) => {
	return validate(parts, validator);
};
