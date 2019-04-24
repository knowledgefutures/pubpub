import React, { useState, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Intent } from '@blueprintjs/core';
import Editor, {
	getText,
	getJSON,
	removeLocalHighlight,
	convertLocalHighlightToDiscussion,
} from '@pubpub/editor';
import { Avatar } from 'components';
import { PageContext } from 'components/PageWrapper/PageWrapper';
import { apiFetch } from 'utils';

const propTypes = {
	pubData: PropTypes.object.isRequired,
	collabData: PropTypes.object.isRequired,
	firebaseBranchRef: PropTypes.object.isRequired,
	discussionId: PropTypes.string.isRequired,
	discussionState: PropTypes.object.isRequired,
	dispatch: PropTypes.func.isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const PubDiscussionThreadNew = (props) => {
	const { pubData, collabData, discussionId, discussionState, dispatch, updateLocalData } = props;
	const { loginData, communityData } = useContext(PageContext);
	const { editorView } = discussionState;
	const pubView = collabData.editorChangeObject.view;
	const [isLoading, setIsLoading] = useState(false);
	useEffect(() => {
		if (editorView) {
			editorView.focus();
		}
	}, [editorView]);

	const handlePostDiscussion = () => {
		setIsLoading(true);
		return apiFetch('/api/discussions', {
			method: 'POST',
			body: JSON.stringify({
				discussionId: discussionId,
				userId: loginData.id,
				pubId: pubData.id,
				branchId: pubData.activeBranch.id,
				communityId: communityData.id,
				content: getJSON(editorView),
				text: getText(editorView) || '',
			}),
		})
			.then((discussionData) => {
				return Promise.all([
					discussionData,
					convertLocalHighlightToDiscussion(
						pubView,
						discussionId,
						props.firebaseBranchRef,
					),
					dispatch({ id: discussionId, delete: true }),
				]);
			})
			.then(([discussionData]) => {
				updateLocalData('pub', {
					...pubData,
					discussions: [...pubData.discussions, discussionData],
				});
			})
			.then(() => {
				dispatch({ id: discussionId, key: 'isOpen', value: true });
			});
	};

	return (
		<div className="discussion-thread" tabIndex={-1}>
			<div className="discussion-item">
				<div className="avatar-wrapper">
					<Avatar
						width={30}
						userInitials={loginData.intials}
						userAvatar={loginData.avatar}
					/>
				</div>
				<div className="content-wrapper">
					<div className="discussion-body-wrapper editable">
						<Editor
							placeholder="Type your discussion here..."
							onChange={(editorChangeObject) => {
								dispatch({
									id: discussionId,
									key: 'editorView',
									value: editorChangeObject.view,
								});
							}}
						/>
					</div>
					<Button
						className="discussion-primary-button"
						intent={Intent.PRIMARY}
						text="Post Discussion"
						loading={isLoading}
						onClick={handlePostDiscussion}
					/>
					<Button
						text="Cancel"
						onClick={() => {
							removeLocalHighlight(pubView, discussionId);
							dispatch({ id: discussionId, delete: true });
						}}
					/>
				</div>
			</div>
		</div>
	);
};

PubDiscussionThreadNew.propTypes = propTypes;
export default PubDiscussionThreadNew;
