import { useMemo } from 'react';

import { DefinitelyHas, Submission, PubPageData, DocJson } from 'types';
import { EditorChangeObject, isEmptyDoc } from 'client/components/Editor';

import { IdlePatchFn, useIdlyUpdatedState } from 'client/utils/useIdlyUpdatedState';
import { SpubHeaderTab } from './SpubHeader/SpubHeader';

type Options = {
	pubData: PubPageData;
	editorChangeObject: null | EditorChangeObject;
};

export type PubSubmissionState = {
	submission: DefinitelyHas<Submission, 'submissionWorkflow'>;
	selectedTab: SpubHeaderTab;
	submissionPreviewDoc: null | DocJson;
};

type UpdatablePubSubmissionState = Omit<PubSubmissionState, 'submissionPreviewDoc'>;
export type PubSubmissionStatePatchFn = IdlePatchFn<UpdatablePubSubmissionState>;

const createSubmissionPreview = (doc: DocJson, abstract: DocJson) => {
	if (isEmptyDoc(abstract)) {
		return doc;
	}
	return {
		...doc,
		content: [
			{
				type: 'heading',
				attrs: { level: 1, id: 'abstract' },
				content: [{ type: 'text', text: 'Abstract' }],
			},
			...abstract.content,
			...doc.content,
		],
	};
};

const getInitialSubmissionState = (pub: PubPageData): null | UpdatablePubSubmissionState => {
	const { submission } = pub;
	if (submission && !pub.isRelease && !pub.isReviewingPub) {
		const { status } = submission;
		return {
			selectedTab: status === 'incomplete' ? 'instructions' : 'preview',
			submission,
		};
	}
	return null;
};

export const usePubSubmissionState = (options: Options) => {
	const { pubData, editorChangeObject } = options;
	const [submissionState, updateSubmissionState] = useIdlyUpdatedState(() =>
		getInitialSubmissionState(pubData),
	);

	const editorDoc = editorChangeObject?.view?.state.doc;

	const abstractToCreatePreview =
		submissionState?.submission.status === 'incomplete' &&
		submissionState?.selectedTab === 'preview' &&
		submissionState?.submission.abstract;

	const submissionPreviewDoc = useMemo(() => {
		if (abstractToCreatePreview && editorDoc) {
			return createSubmissionPreview(editorDoc.toJSON() as DocJson, abstractToCreatePreview);
		}
		return null;
	}, [editorDoc, abstractToCreatePreview]);

	return [
		submissionState ? { ...submissionState, submissionPreviewDoc } : null,
		updateSubmissionState as IdlePatchFn<UpdatablePubSubmissionState>,
	] as const;
};
