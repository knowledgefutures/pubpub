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
	threadData: PropTypes.array.isRequired,
};

const PubDiscussionThread = (props) => {
	const { discussionId, discussionState, dispatch, threadData } = props;
	const { isOpen, editorState } = discussionState;
	// console.log(threadData);
	if (!isOpen) {
		return null;
	}
	return (
		<div className="bp3-card bp3-elevation-2">
			{threadData.map((item) => {
				return <Editor key={item.id} initialContent={item.content} />;
			})}
		</div>
	);
};

PubDiscussionThread.propTypes = propTypes;
export default PubDiscussionThread;
