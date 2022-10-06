import React, { useContext, useState, useCallback } from 'react';
import { useBeforeUnload } from 'react-use';
import * as Sentry from '@sentry/browser';
import { useDebouncedCallback } from 'use-debounce/lib';

import { Editor } from 'components';
import discussionSchema from 'components/Editor/schemas/discussion';
import malformedDocPlugin from 'client/components/Editor/plugins/malformedDoc';
import { EditorChangeObject, CollaborativeEditorStatus } from 'client/components/Editor';

import { useFacetsQuery } from 'client/utils/useFacets';
import { usePubContext } from '../pubHooks';
import { PubSuspendWhileTypingContext } from '../PubSuspendWhileTyping';
import PubErrorAlert from './PubErrorAlert';

require('./pubBody.scss');

type Props = {
	editorWrapperRef: React.Ref<HTMLDivElement>;
};

const markSentryError = (err: Error) => {
	if (typeof window !== 'undefined' && (window as any).sentryIsActive) {
		Sentry.configureScope((scope) => scope.setTag('error_source', 'editor'));
		Sentry.captureException(err);
	}
};

const PubBody = (props: Props) => {
	const { editorWrapperRef } = props;
	const {
		noteManager,
		updateCollabData,
		historyData: { setLatestHistoryKey },
		collabData: { status, firebaseDraftRef, localCollabUser },
		pubBodyState: {
			editorKey,
			initialContent,
			initialHistoryKey,
			isReadOnly,
			includeCollabPlugin,
			includeDiscussionsPlugin,
			discussionAnchors,
		},
	} = usePubContext();
	const [editorErrorTime, setEditorErrorTime] = useState<number | null>(null);
	const [lastSavedTime, setLastSavedTime] = useState<number | null>(null);
	const { markLastInput } = useContext(PubSuspendWhileTypingContext);
	const nodeLabels = useFacetsQuery((F) => F.NodeLabels);

	useBeforeUnload(
		(status === 'saving' || status === 'disconnected') && !editorErrorTime,
		'Your Pub has changes that are still unsaved. Are you sure you wish to leave?',
	);

	const handleKeyPress = useCallback(() => {
		markLastInput();
		return false;
	}, [markLastInput]);

	const handleError = useCallback((err: Error) => {
		setEditorErrorTime(Date.now());
		markSentryError(err);
	}, []);

	const [handleStatusChange] = useDebouncedCallback((nextStatus: CollaborativeEditorStatus) => {
		if (nextStatus === 'saved') {
			setLastSavedTime(Date.now());
		}
		updateCollabData({ status: nextStatus });
	}, 250);

	const handleEditorChange = useCallback(
		(editorChangeObject: EditorChangeObject) => {
			updateCollabData({ editorChangeObject });
		},
		[updateCollabData],
	);

	const collaborativeOptions = includeCollabPlugin &&
		!!firebaseDraftRef && {
			initialDocKey: initialHistoryKey,
			firebaseRef: firebaseDraftRef,
			clientData: localCollabUser,
			onStatusChange: handleStatusChange,
			onUpdateLatestKey: setLatestHistoryKey,
		};

	const discussionOptions = includeDiscussionsPlugin && {
		draftRef: firebaseDraftRef,
		initialHistoryKey,
		discussionAnchors: discussionAnchors || [],
	};

	return (
		<main className="pub-body-component" ref={editorWrapperRef}>
			<Editor
				key={editorKey}
				customNodes={discussionSchema}
				enableSuggestions
				nodeLabels={nodeLabels}
				noteManager={noteManager}
				placeholder={isReadOnly ? undefined : 'Begin writing here...'}
				initialContent={initialContent}
				isReadOnly={isReadOnly}
				onKeyPress={handleKeyPress}
				onChange={handleEditorChange}
				onError={handleError}
				discussionsOptions={discussionOptions}
				collaborativeOptions={collaborativeOptions}
				customPlugins={{ malformedDocPlugin }}
			/>
			<PubErrorAlert
				pubErrorOccurredAt={editorErrorTime}
				lastSaveOccurredAt={lastSavedTime}
			/>
		</main>
	);
};

export default PubBody;
