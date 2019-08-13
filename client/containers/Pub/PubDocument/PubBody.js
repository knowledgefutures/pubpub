import React, { useRef, useContext, useState } from 'react';
import ReactDOM from 'react-dom';
import { useBeforeUnload } from 'react-use';
import PropTypes from 'prop-types';
import * as Sentry from '@sentry/browser';
import { Card, Alert } from '@blueprintjs/core';
import Editor, { getJSON } from '@pubpub/editor';
import { getResizedUrl } from 'utils';
import TimeAgo from 'react-timeago';
import { saveAs } from 'file-saver';
import { PageContext } from 'components/PageWrapper/PageWrapper';
import { PubSuspendWhileTypingContext } from '../PubSuspendWhileTyping';

import discussionSchema from './DiscussionAddon/discussionSchema';
import { nestDiscussionsToThreads } from './PubDiscussions/discussionUtils';
import DiscussionThread from './PubDiscussions/DiscussionThread';

require('./pubBody.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	collabData: PropTypes.object.isRequired,
	historyData: PropTypes.object.isRequired,
	firebaseBranchRef: PropTypes.object,
	updateLocalData: PropTypes.func.isRequired,
	onSingleClick: PropTypes.func.isRequired,
};
const defaultProps = {
	firebaseBranchRef: undefined,
};

let setSavingTimeout;

const PubBody = (props) => {
	const { pubData, collabData, firebaseBranchRef, updateLocalData, historyData } = props;
	const { communityData } = useContext(PageContext);
	const { isViewingHistory } = historyData;
	const prevStatusRef = useRef(null);
	const embedDiscussions = useRef({});
	const [editorError, setEditorError] = useState(null);
	const [editorErrorTime, setEditorErrorTime] = useState(null);
	const [lastSavedTime, setLastSavedTime] = useState(null);
	prevStatusRef.current = collabData.status;

	useBeforeUnload(
		(collabData.status === 'saving' || collabData.status === 'disconnected') && !editorError,
		'Your pub has not finished saving. Are you sure you wish to leave?',
	);

	const downloadBackup = () => {
		const docJson = getJSON(collabData.editorChangeObject.view);
		const blob = new Blob([JSON.stringify(docJson, null, 2)], {
			type: 'text/plain;charset=utf-8',
		});
		saveAs(blob, `${pubData.title}_backup.json`);
	};

	const getNextStatus = (status, onComplete) => {
		clearTimeout(setSavingTimeout);
		const prevStatus = prevStatusRef.current;
		const nextStatus = { status: status };

		/* If loading, wait until 'connected' */
		if (prevStatus === 'connecting' && status === 'connected') {
			onComplete(nextStatus);
		}

		if (prevStatus !== 'connecting' && prevStatus !== 'disconnected') {
			if (status === 'saving') {
				setSavingTimeout = setTimeout(() => {
					onComplete(nextStatus);
				}, 250);
			} else {
				onComplete(nextStatus);
				setLastSavedTime(Date.now());
			}
		}
		/* If disconnected, only set state if the new status is 'connected' */
		if (prevStatus === 'disconnected' && status === 'connected') {
			onComplete(nextStatus);
		}
	};
	const editorKeyHistory = isViewingHistory && historyData.historyDocKey;
	const editorKeyCollab = firebaseBranchRef ? 'ready' : 'unready';
	const editorKey = editorKeyHistory || editorKeyCollab;
	const isHistoryDoc = isViewingHistory && historyData.historyDoc;
	const useCollaborativeOptions = firebaseBranchRef && !pubData.isStaticDoc && !isHistoryDoc;
	const isReadOnly = !!(pubData.isStaticDoc || !pubData.canEditBranch || isViewingHistory);
	const initialContent = (isViewingHistory && historyData.historyDoc) || pubData.initialDoc;
	const { markLastInput } = useContext(PubSuspendWhileTypingContext);
	const showErrorTime = lastSavedTime && editorErrorTime - lastSavedTime > 500;
	return (
		<div className="pub-body-component">
			<style>
				{`
					.editor.ProseMirror h1#abstract:first-child {
						color: ${communityData.accentColorDark};
					}
				`}
			</style>
			<Editor
				key={editorKey}
				customNodes={{
					...discussionSchema,
				}}
				nodeOptions={{
					image: {
						onResizeUrl: (url) => {
							return getResizedUrl(url, 'fit-in', '800x0');
						},
					},
					discussion: {
						addRef: (embedId, mountRef, threadNumber) => {
							embedDiscussions.current[embedId] = {
								mountRef: mountRef,
								threadNumber: threadNumber,
							};
						},
						removeRef: (embedId) => {
							delete embedDiscussions.current[embedId];
						},
					},
				}}
				placeholder={pubData.isStaticDoc ? undefined : 'Begin writing here...'}
				initialContent={initialContent}
				isReadOnly={isReadOnly}
				onChange={(editorChangeObject) => {
					markLastInput();
					if (!isHistoryDoc) {
						updateLocalData('collab', { editorChangeObject: editorChangeObject });
					}
				}}
				onError={(err) => {
					setEditorError(err);
					setEditorErrorTime(Date.now());
					if (typeof window !== 'undefined' && window.sentryIsActive) {
						Sentry.configureScope((scope) => {
							scope.setTag('error_source', 'editor');
						});
						Sentry.captureException(err);
					}
				}}
				collaborativeOptions={
					useCollaborativeOptions
						? {
								firebaseRef: firebaseBranchRef,
								clientData: props.collabData.localCollabUser,
								initialDocKey: pubData.initialDocKey,
								onStatusChange: (status) => {
									getNextStatus(status, (nextStatus) => {
										props.updateLocalData('collab', nextStatus);
									});
								},
								onUpdateLatestKey: (latestKey) => {
									props.updateLocalData('history', {
										latestKey: latestKey,
										currentKey: latestKey,
									});
								},
						  }
						: undefined
				}
				highlights={[]}
				handleSingleClick={props.onSingleClick}
			/>
			{!!editorError && (
				<Alert
					isOpen={editorError}
					icon="error"
					confirmButtonText="Refresh Page"
					onConfirm={() => {
						window.location.reload();
					}}
					cancelButtonText={showErrorTime ? 'Download backup' : undefined}
					onCancel={showErrorTime ? downloadBackup : undefined}
					className="pub-body-alert"
				>
					<h5>Uh oh! An error has occured in the editor.</h5>
					<p>We've logged the error and will look into the cause right away.</p>
					{showErrorTime && (
						<React.Fragment>
							<p className="error-time">
								Your changes were last saved{' '}
								<TimeAgo
									formatter={(value, unit, suffix) => {
										const unitSuffix = value === 1 ? '' : 's';
										return `${value} ${unit}${unitSuffix} ${suffix}`;
									}}
									date={lastSavedTime}
									now={() => editorErrorTime}
								/>
								.
							</p>
							<p>
								If you are concerned about unsaved changes being lost, please
								download a backup copy of your document below.
							</p>
						</React.Fragment>
					)}
					{!showErrorTime && (
						<p className="error-time">
							All previous changes have been successfully saved.
						</p>
					)}
					<p>To continue editing, please refresh the page.</p>
				</Alert>
			)}
			{/* For now, we have PubBody mount Portals for embedded Discussions */}
			{Object.keys(embedDiscussions.current).map((embedId) => {
				const mountRef = embedDiscussions.current[embedId].mountRef;
				if (!mountRef.current) {
					return null;
				}

				const threadNumber = embedDiscussions.current[embedId].threadNumber;
				const threads = nestDiscussionsToThreads(pubData.discussions);
				const activeThread = threads.reduce((prev, curr) => {
					if (curr[0].threadNumber === threadNumber) {
						return curr;
					}
					return prev;
				}, undefined);

				return ReactDOM.createPortal(
					<React.Fragment>
						{!activeThread && (
							<Card>Please select a discussion from the formatting bar.</Card>
						)}
						{activeThread && (
							<DiscussionThread
								key={embedId}
								pubData={pubData}
								collabData={collabData}
								firebaseBranchRef={firebaseBranchRef}
								threadData={activeThread}
								updateLocalData={updateLocalData}
								canPreview={true}
							/>
						)}
					</React.Fragment>,
					mountRef.current,
				);
			})}
		</div>
	);
};

PubBody.propTypes = propTypes;
PubBody.defaultProps = defaultProps;
export default PubBody;
