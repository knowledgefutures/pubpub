import type { CollaborativeEditorStatus, EditorChangeObject } from 'client/components/Editor';

import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';

import * as Sentry from '@sentry/react';
import { useBeforeUnload } from 'react-use';
import { useDebouncedCallback } from 'use-debounce/lib';

import { apiFetch } from 'client/utils/apiFetch';
import malformedDocPlugin from 'client/components/Editor/plugins/malformedDoc';
import buildSuggestedEdits from 'client/components/Editor/plugins/suggestedEdits';
import { useFacetsQuery } from 'client/utils/useFacets';
import { Editor } from 'components';
import discussionSchema from 'components/Editor/schemas/discussion';
import { usePageContext } from 'utils/hooks';

import { PubSuspendWhileTypingContext } from '../PubSuspendWhileTyping';
import { usePubContext } from '../pubHooks';
import PubErrorAlert from './PubErrorAlert';

import './pubBody.scss';

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
		pubData,
		noteManager,
		updateCollabData,
		updateLocalData,
		historyData: { setLatestHistoryKey },
		collabData: { status, localCollabUser },
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
	const { featureFlags } = usePageContext();

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

	const handlePresenceChange = useCallback(
		(users: any[]) => {
			updateCollabData({ remoteCollabUsers: users });
		},
		[updateCollabData],
	);

	const fetchedDiscussionIds = useRef(new Set<string>());

	const handleNewDiscussionIds = useCallback(
		(ids: string[]) => {
			const unfetched = ids.filter((id) => !fetchedDiscussionIds.current.has(id));
			if (unfetched.length === 0) return;
			unfetched.forEach((id) => fetchedDiscussionIds.current.add(id));

			apiFetch(`/api/pubs/${pubData.id}/discussions?ids=${unfetched.join(',')}`)
				.then((newDiscussions: any[]) => {
					if (newDiscussions.length > 0) {
						updateLocalData('pub', {
							discussions: [...pubData.discussions, ...newDiscussions],
						});
					}
				})
				.catch(() => {});
		},
		[pubData.id, pubData.discussions, updateLocalData],
	);

	const updateLocalDataRef = useRef(updateLocalData);
	updateLocalDataRef.current = updateLocalData;

	useEffect(() => {
		if (!includeCollabPlugin || !includeDiscussionsPlugin) return undefined;
		const pubId = pubData.id;
		const interval = setInterval(() => {
			apiFetch(`/api/pubs/${pubId}/discussions`)
				.then((discussions: any[]) => {
					updateLocalDataRef.current('pub', { discussions });
				})
				.catch(() => {});
		}, 5000);
		return () => clearInterval(interval);
	}, [pubData.id, includeCollabPlugin, includeDiscussionsPlugin]);

	const collaborativeOptions = includeCollabPlugin && {
		pubId: pubData.id,
		initialDocKey: initialHistoryKey,
		clientData: localCollabUser,
		onStatusChange: handleStatusChange,
		onUpdateLatestKey: setLatestHistoryKey,
		onPresenceChange: handlePresenceChange,
	};

	const discussionOptions = includeDiscussionsPlugin && {
		pubId: includeCollabPlugin ? pubData.id : null,
		initialHistoryKey,
		discussionAnchors: discussionAnchors || [],
		onNewDiscussionIds: handleNewDiscussionIds,
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
				customPlugins={{
					malformedDocPlugin,
					suggestedEdits: featureFlags.suggestedEdits ? buildSuggestedEdits : null,
				}}
			/>
			<PubErrorAlert
				pubErrorOccurredAt={editorErrorTime}
				lastSaveOccurredAt={lastSavedTime}
			/>
		</main>
	);
};

export default PubBody;
