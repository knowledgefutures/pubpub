import { SubmissionWorkflow } from 'types';

export type EditableSubmissionWorkflow = Omit<SubmissionWorkflow, 'id' | 'createdAt' | 'updatedAt'>;
