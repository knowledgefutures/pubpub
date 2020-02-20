import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Editor, {
	getText,
	getJSON,
	removeLocalHighlight,
	convertLocalHighlightToDiscussion,
	getLocalHighlightText,
} from '@pubpub/editor';
import { AnchorButton, Button, Intent } from '@blueprintjs/core';
import { Avatar } from 'components';
import { usePageContext } from 'utils/hooks';
import FormattingBarLegacy from 'components/FormattingBarLegacy/FormattingBar';
import { apiFetch } from 'utils';

const propTypes = {
	pubData: PropTypes.object.isRequired,
	collabData: PropTypes.object.isRequired,
	firebaseBranchRef: PropTypes.object,
	threadData: PropTypes.object.isRequired,
	updateLocalData: PropTypes.func.isRequired,
	isPubBottomInput: PropTypes.bool,
	historyData: PropTypes.object.isRequired,
};

const defaultProps = {
	firebaseBranchRef: undefined,
	isPubBottomInput: false,
};

const getPlaceholderText = (isNewThread, isPubBottomInput) => {
	if (isPubBottomInput) {
		return 'Start a discussion here (or highlight some text above to begin one inline)';
	}
	return isNewThread ? 'Add your discussion...' : 'Add a reply...';
};

const DiscussionInput = (props) => {
	const {
		pubData,
		collabData,
		updateLocalData,
		threadData,
		isPubBottomInput,
		historyData,
	} = props;
	const { loginData, locationData, communityData } = usePageContext();
	const pubView = collabData.editorChangeObject.view;
	const [changeObject, setChangeObject] = useState({});
	const [isLoading, setIsLoading] = useState(false);
	const [didFocus, setDidFocus] = useState(false);
	const [editorKey, setEditorKey] = useState(Date.now());
	const isNewThread = !threadData.number;
	useEffect(() => {
		if (!isPubBottomInput && (isNewThread || didFocus) && changeObject.view) {
			changeObject.view.focus();
		}
	}, [isNewThread, changeObject.view, didFocus, isPubBottomInput]);

	const handlePostDiscussion = () => {
		setIsLoading(true);
		const initAnchorData = getLocalHighlightText(pubView, threadData.id);
		return apiFetch('/api/discussions', {
			method: 'POST',
			body: JSON.stringify({
				accessHash: locationData.query.access,
				threadId: isNewThread ? threadData.id : undefined,
				// discussionId: isNewThread ? threadData[0].id : undefined,
				// threadNumber: isNewThread ? undefined : threadData[0].threadNumber,
				pubId: pubData.id,
				branchId: pubData.activeBranch.id,
				branchKey: historyData.currentKey,
				communityId: communityData.id,
				content: getJSON(changeObject.view),
				text: getText(changeObject.view) || '',
				initAnchorData: initAnchorData,
			}),
		})
			.then((outputData) => {
				if (!isNewThread) {
					return Promise.all([outputData, null]);
				}
				const convertHighlight = props.firebaseBranchRef
					? convertLocalHighlightToDiscussion(
							pubView,
							threadData.id,
							props.firebaseBranchRef,
					  )
					: () => {};
				return Promise.all([null, outputData, convertHighlight]);
			})
			.then(([[newComment, newThread]]) => {
				if (newThread) {
					updateLocalData('pub', {
						discussions: [...pubData.discussions, newThread],
						threads: [...pubData.threads, newThread],
					});
				}
				if (!newThread) {
					updateLocalData('pub', {
						discussions: pubData.discussions.map((disc) => {
							if (disc.id === newComment.threadId) {
								return {
									...disc,
									comments: [...disc.comments, newComment],
								};
							}
							return disc;
						}),
						threads: pubData.threads.map((thread) => {
							if (thread.id === newComment.threadId) {
								return {
									...thread,
									comments: [...thread.comments, newComment],
								};
							}
							return thread;
						}),
					});
				}
				if (isPubBottomInput) {
					setIsLoading(false);
					setEditorKey(Date.now());
				}
			});
	};

	const isLoggedIn = loginData.id;
	const redirectString = `?redirect=${locationData.path}${
		locationData.queryString.length > 1 ? locationData.queryString : ''
	}`;
	return (
		<div className="discussion-item-component input">
			<div className="avatar-wrapper">
				<Avatar width={18} initials={loginData.intials} avatar={loginData.avatar} />
			</div>
			{!isLoggedIn && (
				<React.Fragment>
					<AnchorButton
						className="discussion-primary-button"
						text="Login to discuss"
						href={`/login${redirectString}`}
						small={true}
					/>
					{isNewThread && !isPubBottomInput && (
						<Button
							className="discussion-cancel-button"
							text="Cancel"
							small={true}
							onClick={() => {
								removeLocalHighlight(pubView, threadData.id);
							}}
						/>
					)}
				</React.Fragment>
			)}
			{isLoggedIn && !isNewThread && !didFocus && (
				<input
					type="text"
					className="simple-input"
					placeholder="Add a reply..."
					onFocus={() => {
						setDidFocus(true);
					}}
				/>
			)}
			{isLoggedIn && (isNewThread || didFocus) && (
				<div className="content-wrapper">
					<div className="discussion-body-wrapper editable">
						<Editor
							key={editorKey}
							placeholder={getPlaceholderText(isNewThread, isPubBottomInput)}
							onChange={(editorChangeObject) => {
								setChangeObject(editorChangeObject);
							}}
						/>
					</div>
					<FormattingBarLegacy
						editorChangeObject={changeObject || {}}
						threads={[]}
						hideBlocktypes={true}
						hideExtraFormatting={true}
						isSmall={true}
					/>
					<Button
						className="discussion-primary-button"
						intent={Intent.PRIMARY}
						text={isNewThread ? 'Post Discussion' : 'Post Reply'}
						loading={isLoading}
						disabled={!getText(changeObject.view)}
						onClick={handlePostDiscussion}
						small={true}
					/>
					{isNewThread && !isPubBottomInput && (
						<Button
							className="discussion-cancel-button"
							text="Cancel"
							small={true}
							onClick={() => {
								removeLocalHighlight(pubView, threadData.id);
							}}
						/>
					)}
				</div>
			)}
		</div>
	);
};

DiscussionInput.propTypes = propTypes;
DiscussionInput.defaultProps = defaultProps;
export default DiscussionInput;
