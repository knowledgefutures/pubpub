import React, { useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Editor, {
	getText,
	getJSON,
	removeLocalHighlight,
	convertLocalHighlightToDiscussion,
	getLocalHighlightText,
} from '@pubpub/editor';
import { AnchorButton, Button, Intent } from '@blueprintjs/core';
import { PageContext } from 'components/PageWrapper/PageWrapper';
import { Avatar, FormattingBar } from 'components';
import { apiFetch } from 'utils';

const propTypes = {
	pubData: PropTypes.object.isRequired,
	collabData: PropTypes.object.isRequired,
	firebaseBranchRef: PropTypes.object,
	threadData: PropTypes.array.isRequired,
	updateLocalData: PropTypes.func.isRequired,
	isPubBottomInput: PropTypes.bool,
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
	const { pubData, collabData, updateLocalData, threadData, isPubBottomInput } = props;
	const { loginData, locationData, communityData } = useContext(PageContext);
	const pubView = collabData.editorChangeObject.view;
	const [changeObject, setChangeObject] = useState({});
	const [isLoading, setIsLoading] = useState(false);
	const [didFocus, setDidFocus] = useState(false);
	const [editorKey, setEditorKey] = useState(Date.now());
	const isNewThread = !threadData[0].threadNumber;
	useEffect(() => {
		if (!isPubBottomInput && (isNewThread || didFocus) && changeObject.view) {
			changeObject.view.focus();
		}
	}, [isNewThread, changeObject.view, didFocus, isPubBottomInput]);

	const handlePostDiscussion = () => {
		setIsLoading(true);
		const initAnchorText = getLocalHighlightText(pubView, threadData[0].id);
		return apiFetch('/api/discussions', {
			method: 'POST',
			body: JSON.stringify({
				discussHash: locationData.query.access,
				discussionId: isNewThread ? threadData[0].id : undefined,
				threadNumber: isNewThread ? undefined : threadData[0].threadNumber,
				pubId: pubData.id,
				branchId: pubData.activeBranch.id,
				communityId: communityData.id,
				content: getJSON(changeObject.view),
				text: getText(changeObject.view) || '',
				initAnchorText: initAnchorText,
			}),
		})
			.then((discussionData) => {
				if (!isNewThread) {
					return Promise.all([discussionData]);
				}
				const convertHighlight = props.firebaseBranchRef
					? convertLocalHighlightToDiscussion(
							pubView,
							threadData[0].id,
							props.firebaseBranchRef,
					  )
					: () => {};
				return Promise.all([discussionData, convertHighlight]);
			})
			.then(([discussionData]) => {
				updateLocalData('pub', {
					discussions: [...pubData.discussions, discussionData],
				});
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
				<Avatar width={18} userInitials={loginData.intials} userAvatar={loginData.avatar} />
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
								removeLocalHighlight(pubView, threadData[0].id);
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
					<FormattingBar
						editorChangeObject={changeObject || {}}
						showBlockTypes={false}
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
								removeLocalHighlight(pubView, threadData[0].id);
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
