import { useMemo } from 'react';
import { DiscussionAnchor, DocJson } from 'types';
import { usePageContext } from 'utils/hooks';

import { PubContextType } from './PubContextProvider';

type Options = Pick<PubContextType, 'pubData' | 'submissionState' | 'collabData' | 'historyData'>;

export type PubBodyState = {
	hidePubBody?: true;
	initialContent: DocJson;
	initialHistoryKey: number;
	includeCollabPlugin: boolean;
	includeDiscussionsPlugin: boolean;
	isReadOnly: boolean;
	editorKey: string | number;
	discussionAnchors: null | DiscussionAnchor[];
	canCreateAnchoredDiscussions: boolean;
};

export const usePubBodyState = (options: Options): PubBodyState => {
	const {
		pubData: {
			initialDoc,
			initialDocKey,
			isInMaintenanceMode,
			isRelease,
			isReview,
			discussions,
		},
		submissionState,
		historyData: { currentKey, isViewingHistory, historyDoc, historyDocEditorKey },
		collabData: { firebaseDraftRef },
	} = options;
	const {
		scopeData: {
			activePermissions: { canEdit, canEditDraft },
		},
	} = usePageContext();

	const discussionAnchors = useMemo(() => {
		if (isRelease) {
			return discussions
				.map((discussion) =>
					discussion.anchors!.filter((anchor) => anchor.historyKey === currentKey),
				)
				.reduce((a, b) => [...a, ...b], []);
		}
		return [];
	}, [discussions, isRelease, currentKey]);

	if (isInMaintenanceMode) {
		return {
			editorKey: 'maintenance',
			isReadOnly: true,
			initialContent: initialDoc,
			initialHistoryKey: initialDocKey,
			includeCollabPlugin: false,
			includeDiscussionsPlugin: false,
			discussionAnchors: null,
			canCreateAnchoredDiscussions: false,
		};
	}

	if (isViewingHistory && historyDoc && historyDocEditorKey) {
		return {
			editorKey: historyDocEditorKey,
			isReadOnly: true,
			initialContent: historyDoc,
			initialHistoryKey: initialDocKey,
			includeCollabPlugin: false,
			includeDiscussionsPlugin: false,
			discussionAnchors: null,
			canCreateAnchoredDiscussions: false,
		};
	}

	if (submissionState) {
		const submissionPreviewDoc = submissionState?.submissionPreviewDoc;
		if (submissionPreviewDoc) {
			return {
				editorKey: `submission-preview-${currentKey}`,
				isReadOnly: true,
				initialContent: submissionPreviewDoc,
				initialHistoryKey: initialDocKey,
				includeCollabPlugin: false,
				includeDiscussionsPlugin: false,
				discussionAnchors,
				canCreateAnchoredDiscussions: false,
			};
		}
		if (submissionState.selectedTab === 'instructions') {
			return {
				editorKey: '',
				hidePubBody: true,
				isReadOnly: true,
				includeCollabPlugin: false,
				initialContent: initialDoc,
				initialHistoryKey: initialDocKey,
				includeDiscussionsPlugin: false,
				discussionAnchors: null,
				canCreateAnchoredDiscussions: false,
			};
		}
	}

	if (isRelease) {
		return {
			editorKey: 'release',
			isReadOnly: true,
			initialHistoryKey: initialDocKey,
			initialContent: initialDoc,
			includeCollabPlugin: false,
			includeDiscussionsPlugin: true,
			discussionAnchors,
			canCreateAnchoredDiscussions: true,
		};
	}

	if (isReview) {
		return {
			editorKey: 'review',
			isReadOnly: true,
			initialHistoryKey: initialDocKey,
			initialContent: initialDoc,
			includeCollabPlugin: false,
			includeDiscussionsPlugin: false,
			discussionAnchors: null,
			canCreateAnchoredDiscussions: false,
		};
	}

	return {
		editorKey: firebaseDraftRef ? 'ready' : 'unready',
		isReadOnly: !(canEdit || canEditDraft),
		initialContent: initialDoc,
		initialHistoryKey: initialDocKey,
		includeCollabPlugin: !!firebaseDraftRef,
		includeDiscussionsPlugin: true,
		discussionAnchors,
		canCreateAnchoredDiscussions: true,
	};
};
