import { useMemo } from 'react';
import { DocJson } from 'types';
import { usePubContext } from '../pubHooks';

type PubBodyState = {
	initialContent: DocJson;
	includeCollabPlugin: boolean;
	isReadOnly: boolean;
	key: string | number;
};

const createSubmissionPreview = (doc: DocJson, abstract: DocJson) => {
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

export const usePubBodyState = (): PubBodyState => {
	const {
		pubData: { initialDoc, isInMaintenanceMode, isReadOnly },
		submissionState,
		firebaseDraftRef,
		historyData: { currentKey, isViewingHistory, historyDoc, historyDocKey },
		collabData: { editorChangeObject },
	} = usePubContext();

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

	if (isInMaintenanceMode) {
		return {
			key: 'maintenance',
			isReadOnly: true,
			initialContent: initialDoc,
			includeCollabPlugin: false,
		};
	}

	if (isViewingHistory && historyDoc) {
		return {
			key: historyDocKey,
			isReadOnly: true,
			initialContent: historyDoc,
			includeCollabPlugin: false,
		};
	}

	if (submissionPreviewDoc) {
		return {
			key: `submission-preview-${currentKey}`,
			isReadOnly: true,
			initialContent: submissionPreviewDoc,
			includeCollabPlugin: false,
		};
	}

	return {
		key: firebaseDraftRef ? 'ready' : 'unready',
		isReadOnly,
		initialContent: initialDoc,
		includeCollabPlugin: true,
	};
};
