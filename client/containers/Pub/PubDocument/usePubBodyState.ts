import { isEmptyDoc } from 'client/components/Editor';
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
	const isEmpty = isEmptyDoc(abstract);
	if (isEmpty) {
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

export const usePubBodyState = (): PubBodyState => {
	const {
		pubData: { initialDoc, isInMaintenanceMode, isReadOnly },
		submissionState,
		firebaseDraftRef,
		historyData: { currentKey, isViewingHistory, historyDoc, historyDocKey },
		collabData: { editorChangeObject },
	} = usePubContext();

	const editorDoc = editorChangeObject?.view?.state.doc;
	const submissionStatus = submissionState?.submission.status;
	const submissionAbstract = submissionState?.submission.abstract;
	const submissionTab = submissionState?.selectedTab;

	const submissionPreviewDoc = useMemo(() => {
		if (submissionStatus === 'incomplete' && submissionTab === 'preview' && editorDoc) {
			const editorDocJson = editorDoc.toJSON() as DocJson;
			if (submissionAbstract && editorDoc) {
				return createSubmissionPreview(editorDocJson, submissionAbstract);
			}
			return editorDocJson;
		}
		return null;
	}, [editorDoc, submissionAbstract, submissionStatus, submissionTab]);

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
