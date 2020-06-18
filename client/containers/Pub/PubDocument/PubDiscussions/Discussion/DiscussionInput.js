import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { AnchorButton, Button, Intent } from '@blueprintjs/core';

import Editor, {
	getText,
	getJSON,
	removeLocalHighlight,
	convertLocalHighlightToDiscussion,
	getLocalHighlightText,
} from 'components/Editor';
import { Avatar } from 'components';
import FormattingBarLegacy from 'components/FormattingBarLegacy/FormattingBar';
import { usePageContext } from 'utils/hooks';
import { apiFetch } from 'client/utils/apiFetch';
import { usePubContext } from 'containers/Pub/pubHooks';

const propTypes = {
	pubData: PropTypes.object.isRequired,
	updateLocalData: PropTypes.func.isRequired,
	discussionData: PropTypes.object.isRequired,
	isPubBottomInput: PropTypes.bool,
};

const defaultProps = {
	isPubBottomInput: false,
};

const getPlaceholderText = (isNewThread, isPubBottomInput) => {
	if (isPubBottomInput) {
		return 'Start a discussion here (or highlight some text above to begin one inline)';
	}
	return isNewThread ? 'Add your discussion...' : 'Add a reply...';
};

const DiscussionInput = (props) => {
	const { discussionData, isPubBottomInput, pubData, updateLocalData } = props;
	const { historyData, collabData, firebaseBranchRef } = usePubContext();
	const { loginData, locationData, communityData } = usePageContext();
	const pubView = collabData.editorChangeObject.view;
	const [changeObject, setChangeObject] = useState({});
	const [isLoading, setIsLoading] = useState(false);
	const [didFocus, setDidFocus] = useState(false);
	const [editorKey, setEditorKey] = useState(Date.now());
	const isNewThread = !discussionData.number;
	useEffect(() => {
		if (!isPubBottomInput && (isNewThread || didFocus) && changeObject.view) {
			changeObject.view.focus();
		}
	}, [isNewThread, changeObject.view, didFocus, isPubBottomInput]);

	const handlePostThreadComment = async () => {
		setIsLoading(true);
		const outputData = await apiFetch('/api/threadComment', {
			method: 'POST',
			body: JSON.stringify({
				accessHash: locationData.query.access,
				parentId: discussionData.id,
				threadId: discussionData.thread.id,
				pubId: pubData.id,
				communityId: communityData.id,
				content: getJSON(changeObject.view),
				text: getText(changeObject.view) || '',
			}),
		});

		updateLocalData('pub', {
			discussions: pubData.discussions.map((disc) => {
				if (disc.thread.id === outputData.threadId) {
					return {
						...disc,
						thread: {
							...disc.thread,
							comments: [...disc.thread.comments, outputData],
						},
					};
				}
				return disc;
			}),
		});

		if (isPubBottomInput) {
			setIsLoading(false);
			setEditorKey(Date.now());
		}
	};

	const handlePostDiscussion = async () => {
		setIsLoading(true);
		const initAnchorData = getLocalHighlightText(pubView, discussionData.id);
		const outputData = await apiFetch('/api/discussions', {
			method: 'POST',
			body: JSON.stringify({
				accessHash: locationData.query.access,
				discussionId: discussionData.id,
				pubId: pubData.id,
				branchId: pubData.activeBranch.id,
				branchKey: historyData.currentKey,
				communityId: communityData.id,
				content: getJSON(changeObject.view),
				text: getText(changeObject.view) || '',
				initAnchorData: initAnchorData,
				visibilityAccess: pubData.isRelease ? 'public' : 'members',
			}),
		});

		updateLocalData('pub', {
			discussions: [...pubData.discussions, outputData],
		});

		if (isPubBottomInput) {
			setIsLoading(false);
			setEditorKey(Date.now());
		} else if (firebaseBranchRef) {
			await convertLocalHighlightToDiscussion(pubView, discussionData.id, firebaseBranchRef);
		}
	};

	const isLoggedIn = loginData.id;
	const redirectString = `?redirect=${locationData.path}${
		locationData.queryString.length > 1 ? locationData.queryString : ''
	}`;
	return (
		<div className="thread-comment-component input">
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
								removeLocalHighlight(pubView, discussionData.id);
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
						onClick={isNewThread ? handlePostDiscussion : handlePostThreadComment}
						small={true}
					/>
					{isNewThread && !isPubBottomInput && (
						<Button
							className="discussion-cancel-button"
							text="Cancel"
							small={true}
							onClick={() => {
								removeLocalHighlight(pubView, discussionData.id);
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
