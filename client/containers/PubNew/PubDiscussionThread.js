import React from 'react';
import PropTypes from 'prop-types';
import Editor from '@pubpub/editor';
import { Button } from '@blueprintjs/core';

const propTypes = {
	pubData: PropTypes.object.isRequired,
	collabData: PropTypes.object.isRequired,
	firebaseBranchRef: PropTypes.object.isRequired,
	discussionId: PropTypes.string.isRequired,
	discussionState: PropTypes.object.isRequired,
	dispatch: PropTypes.func.isRequired,
};

const PubDiscussionThread = (props) => {
	const { discussionId, discussionState, dispatch } = props;
	const { isOpen, editorState } = discussionState;

	return (
		<React.Fragment>
			<Button
				style={{
					position: 'absolute',
					left: '100%',
				}}
				icon="swap-vertical"
				onClick={() => {
					dispatch({ id: discussionId, key: 'isOpen', value: !isOpen });
				}}
			/>
			{isOpen && (
				<div className="bp3-card bp3-elevation-2">
					<Editor
						placeholder="Begin writing here..."
						// This calls .toJSON everytime which seems inefficient
						// Why do we only need this for local changes to doc - and not remote edits?
						initialContent={
							editorState && editorState.doc ? editorState.doc.toJSON() : undefined
						}
						onChange={(editorChangeObject) => {
							dispatch({
								id: discussionId,
								key: 'editorState',
								value: editorChangeObject.view.state,
							});
						}}
					/>
				</div>
			)}
		</React.Fragment>
	);
};

PubDiscussionThread.propTypes = propTypes;
export default PubDiscussionThread;
