import { DocJson } from 'types';
import { LayoutBlockSubmissionBanner } from 'utils/layout';

export type SubmissionWorkflow = {
	id: string;
	createdAt: string;
	updatedAt: string;
	enabled: boolean;
	instructionsText: DocJson;
	emailText: DocJson;
	targetEmailAddress: string;
	collectionId: string;
	layoutBlockContent: LayoutBlockSubmissionBanner['content'];
};
