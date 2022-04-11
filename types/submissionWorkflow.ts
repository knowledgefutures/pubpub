import { Collection, DocJson } from 'types';

export type SubmissionWorkflow = {
	id: string;
	createdAt: string;
	updatedAt: string;
	enabled: boolean;
	title: string;
	introText: DocJson;
	instructionsText: DocJson;
	acceptedText: DocJson;
	declinedText: DocJson;
	receivedEmailText: DocJson;
	targetEmailAddress: string;
	requireAbstract: boolean;
	requireDescription: boolean;
	collectionId: string;
	collection?: Collection;
};
