import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { reanchorDiscussion } from '@pubpub/editor';
import { Button, ButtonGroup, Card, Icon } from '@blueprintjs/core';

require('./discussionReanchor.scss');

const propTypes = {
	discussionData: PropTypes.object.isRequired,
	collabData: PropTypes.object.isRequired,
	firebaseBranchRef: PropTypes.object.isRequired,
};

const DiscussionReanchor = (props) => {
	const { collabData, discussionData, firebaseBranchRef } = props;
	const [isActive, setIsActive] = useState(false);
	const { selection } = collabData.editorChangeObject;
	const onReanchor = () => {
		const { view } = collabData.editorChangeObject;
		reanchorDiscussion(view, firebaseBranchRef, discussionData.id);
		setIsActive(false);
	};

	const anchor = discussionData.anchor || {};
	return (
		<React.Fragment>
			<Button
				small
				minimal
				disabled={isActive}
				onClick={() => setIsActive(true)}
				icon={<Icon icon="text-highlight" iconSize={12} />}
			/>
			{isActive &&
				ReactDOM.createPortal(
					<Card className="discussion-reanchor-component">
						<p>Make a highlight in the document and then click "Re-anchor".</p>
						<p>
							{anchor.prefix}
							<em style={{ fontWeight: 'bold' }}>{anchor.exact}</em>
							{anchor.suffix}
						</p>
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
