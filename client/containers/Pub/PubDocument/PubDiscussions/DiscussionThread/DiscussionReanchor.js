import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { reanchorDiscussion } from '@pubpub/editor';
import { Button, ButtonGroup, Card, Icon, Tooltip } from '@blueprintjs/core';

require('./discussionReanchor.scss');

const propTypes = {
	collabData: PropTypes.object.isRequired,
	firebaseBranchRef: PropTypes.object.isRequired,
	discussionId: PropTypes.string.isRequired,
};

const DiscussionReanchor = (props) => {
	const { collabData, discussionId, firebaseBranchRef } = props;
	const [isActive, setIsActive] = useState(false);
	const { selection } = collabData.editorChangeObject;
	const onReanchor = () => {
		const { view } = collabData.editorChangeObject;
		reanchorDiscussion(view, firebaseBranchRef, discussionId);
		setIsActive(false);
	};

	return (
		<React.Fragment>
			<Tooltip content="Re-anchor discussion">
				<Button
					small
					minimal
					disabled={isActive}
					onClick={() => setIsActive(true)}
					icon={<Icon icon="text-highlight" iconSize={12} />}
				/>
			</Tooltip>
			{isActive &&
				ReactDOM.createPortal(
					<Card className="discussion-reanchor-component">
						<p>Make a highlight in the document and then click "Re-anchor".</p>
						<ButtonGroup>
							<Button onClick={() => setIsActive(false)} style={{ marginRight: 10 }}>
								Cancel
							</Button>
							<Button
								onClick={onReanchor}
								disabled={!selection || selection.empty}
								intent="primary"
							>
								Re-anchor
							</Button>
						</ButtonGroup>
					</Card>,
					document.querySelector('body'),
				)}
		</React.Fragment>
	);
};

DiscussionReanchor.propTypes = propTypes;
export default DiscussionReanchor;
