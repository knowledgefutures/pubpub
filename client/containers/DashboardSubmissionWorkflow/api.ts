import { apiFetch } from 'client/utils/apiFetch';
import { SubmissionWorkflow } from 'types';

import { EditableSubmissionWorkflow } from './types';

export const createSubmissionWorkflow = (
	workflow: Omit<EditableSubmissionWorkflow, 'enabled'>,
	collectionId: string,
) => {
	return apiFetch.post('/api/submissionWorkflows', {
		...workflow,
		collectionId,
		enabled: false,
	});
};

export const updateSubmissionWorkflow = (
	update: Partial<SubmissionWorkflow>,
	collectionId: string,
) => {
	return apiFetch.put('/api/submissionWorkflows', { ...update, collectionId });
};
