import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { ButtonGroup, Button } from '@blueprintjs/core';
import Editor, {
	getText,
	getJSON,
	removeLocalHighlight,
	convertLocalHighlightToDiscussion,
} from '@pubpub/editor';
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
	const { editorState } = discussionState;
	const pubView = collabData.editorChangeObject.view;
	const [isLoading, setIsLoading] = useState(false);
	const [discussionEditorView, setDiscussionEditorView] = useState(null);

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
				content: getJSON(discussionEditorView),
				text: getText(discussionEditorView) || '',
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
		<div className="bp3-card bp3-elevation-2">
			<Editor
				placeholder="New"
				// This calls .toJSON everytime which seems inefficient
				// Why do we only need this for local changes to doc - and not remote edits?
				initialContent={
					editorState && editorState.doc ? editorState.doc.toJSON() : undefined
				}
				onChange={(editorChangeObject) => {
					if (!editorState) {
						editorChangeObject.view.focus();
					}
					setDiscussionEditorView(editorChangeObject.view);
					dispatch({
						id: discussionId,
						key: 'editorState',
						value: editorChangeObject.view.state,
					});
				}}
			/>
			<ButtonGroup>
				<Button
					text="Cancel"
					onClick={() => {
						removeLocalHighlight(pubView, discussionId);
						dispatch({ id: discussionId, delete: true });
					}}
				/>
				<Button text="Save" loading={isLoading} onClick={handlePostDiscussion} />
			</ButtonGroup>
		</div>
	);
};

PubDiscussionThreadNew.propTypes = propTypes;
export default PubDiscussionThreadNew;
