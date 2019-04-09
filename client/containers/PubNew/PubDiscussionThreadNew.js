import React from 'react';
import PropTypes from 'prop-types';
import { ButtonGroup, Button } from '@blueprintjs/core';
import Editor, { removeLocalHighlight, convertLocalHighlightToDiscussion } from '@pubpub/editor';

const propTypes = {
	pubData: PropTypes.object.isRequired,
	collabData: PropTypes.object.isRequired,
	firebaseBranchRef: PropTypes.object.isRequired,
	discussionId: PropTypes.string.isRequired,
	discussionState: PropTypes.object.isRequired,
	dispatch: PropTypes.func.isRequired,
};

const PubDiscussionThreadNew = (props) => {
	const { collabData, discussionId, discussionState, dispatch } = props;
	const { editorState } = discussionState;
	const pubView = collabData.editorChangeObject.view;

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
				<Button
					text="Save"
					onClick={() => {
						convertLocalHighlightToDiscussion(
							pubView,
							discussionId,
							props.firebaseBranchRef,
						);
						dispatch({ id: discussionId, delete: true });
					}}
				/>
			</ButtonGroup>
		</div>
	);
};

PubDiscussionThreadNew.propTypes = propTypes;
export default PubDiscussionThreadNew;
