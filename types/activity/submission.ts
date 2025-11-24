import type { Submission } from '../submission';
import type { Diff } from '../util';
import type { InsertableActivityItemBase } from './base';

type SubmissionActivityItemBase = InsertableActivityItemBase & {
	pubId: string;
	collectionId: string;
	payload: {
		submissionId: string;
		pub: {
			title: string;
		};
	};
};

export type SubmissionUpdatedActivityItem = SubmissionActivityItemBase & {
	kind: 'submission-status-updated';
	payload: {
		status: Diff<Submission['status']>;
	};
};

export type SubmissionActivityItem = SubmissionUpdatedActivityItem;
